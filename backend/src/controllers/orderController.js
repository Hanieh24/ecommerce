const Stripe = require('stripe');
const db = require('../config/database');
const { validateAddressPayload, getTitleId } = require('./addressController');
const { getCartItems, getOrCreateCart } = require('./cartController');
const { mapOrderItemRow, mapOrderRow } = require('../services/orderMapper');
const { ensureOrderSchema } = require('../services/orderSchemaService');

const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const stripeCurrency = process.env.STRIPE_CURRENCY || 'brl';

function getDeliveryFee() {
    const deliveryFee = Number(process.env.DELIVERY_FEE ?? 15);
    return Number.isFinite(deliveryFee) && deliveryFee >= 0 ? deliveryFee : 15;
}

function toCents(value) {
    return Math.round(Number(value) * 100);
}

async function getStatusId(connection, name) {
    await connection.query('INSERT IGNORE INTO status (name) VALUES (?)', [name]);

    const [statuses] = await connection.query(
        'SELECT id FROM status WHERE name = ? LIMIT 1',
        [name]
    );

    return statuses[0].id;
}

async function markOrderPaidFromStripeSession(connection, session) {
    const orderId = Number(session.metadata?.orderId || session.client_reference_id);

    if (!Number.isInteger(orderId) || orderId <= 0) {
        return false;
    }

    const statusId = await getStatusId(connection, 'Pago');

    await connection.query(
        `UPDATE orders
         SET fkStatus = ?, stripePaymentIntentId = ?, paidAt = COALESCE(paidAt, CURRENT_TIMESTAMP)
         WHERE id = ?`,
        [statusId, session.payment_intent || null, orderId]
    );

    return true;
}

async function syncPaidStripeOrders(userId) {
    if (!stripe) {
        return;
    }

    const [orders] = await db.query(
        `SELECT orders.id, orders.stripeSessionId
         FROM orders
         INNER JOIN status ON status.id = orders.fkStatus
         WHERE orders.fkUser = ?
            AND status.name = 'Aguardando pagamento'
            AND orders.stripeSessionId IS NOT NULL`,
        [userId]
    );

    for (const order of orders) {
        try {
            const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);

            if (session.payment_status === 'paid') {
                await markOrderPaidFromStripeSession(db, session);
            }
        } catch (error) {
            console.error(`Não foi possível sincronizar o pedido ${order.id} com Stripe:`, error.message);
        }
    }
}

async function getUserAddress(connection, userId, addressId) {
    const [addresses] = await connection.query(
        'SELECT id FROM address WHERE id = ? AND fkUser = ? LIMIT 1',
        [addressId, userId]
    );

    return addresses[0] || null;
}

async function createCheckoutAddress(connection, userId, addressPayload) {
    const { error, address } = validateAddressPayload(addressPayload);

    if (error) {
        return {
            error
        };
    }

    const titleId = await getTitleId(connection, address.title);

    if (!titleId) {
        return {
            error: 'Escolha um título de endereço válido.'
        };
    }

    const [result] = await connection.query(
        `INSERT INTO address (cep, logradouro, numero, bairro, complemento, fkUser, fkTitle)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            address.cep,
            address.logradouro,
            address.numero,
            address.bairro,
            address.complemento,
            userId,
            titleId
        ]
    );

    return {
        addressId: result.insertId
    };
}

async function resolveCheckoutAddress(connection, userId, body) {
    if (body.addressId) {
        const address = await getUserAddress(connection, userId, Number(body.addressId));

        if (!address) {
            return {
                error: 'Endereço não encontrado.'
            };
        }

        return {
            addressId: address.id
        };
    }

    if (body.address) {
        return createCheckoutAddress(connection, userId, body.address);
    }

    const [addresses] = await connection.query(
        'SELECT id FROM address WHERE fkUser = ? ORDER BY id DESC',
        [userId]
    );

    if (addresses.length === 1) {
        return {
            addressId: addresses[0].id
        };
    }

    return {
        error: addresses.length === 0
            ? 'Cadastre um endereço para finalizar o pedido.'
            : 'Escolha um endereço para finalizar o pedido.',
        addressRequired: true
    };
}

function buildCheckoutUrls(req) {
    const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;

    return {
        successUrl: req.body.successUrl || `${clientUrl}/orders?checkout=success`,
        cancelUrl: req.body.cancelUrl || `${clientUrl}/cart?checkout=cancelled`
    };
}

async function createStripeCheckoutSession(req, order, items) {
    if (!stripe) {
        throw new Error('STRIPE_SECRET_KEY não configurada.');
    }

    const [users] = await db.query(
        'SELECT email FROM User WHERE id = ? LIMIT 1',
        [req.user.id]
    );

    const userEmail = users[0]?.email;
    const isValidEmail = userEmail && userEmail.includes('@') && userEmail.includes('.');
    
    const { successUrl, cancelUrl } = buildCheckoutUrls(req);
    const lineItems = items.map((item) => ({
        quantity: item.quantity,
        price_data: {
            currency: stripeCurrency,
            unit_amount: toCents(item.price),
            product_data: {
                name: item.name
            }
        }
    }));

    if (order.deliveryFee > 0) {
        lineItems.push({
            quantity: 1,
            price_data: {
                currency: stripeCurrency,
                unit_amount: toCents(order.deliveryFee),
                product_data: {
                    name: 'Taxa de entrega'
                }
            }
        });
    }

    const sessionConfig = {
        mode: 'payment',
        payment_method_types: ['card'],
        client_reference_id: String(order.id),
        metadata: {
            orderId: String(order.id),
            userId: String(req.user.id)
        },
        payment_intent_data: {
            metadata: {
                orderId: String(order.id),
                userId: String(req.user.id)
            }
        },
        line_items: lineItems,
        success_url: successUrl,
        cancel_url: cancelUrl
    };

    if (isValidEmail) {
        sessionConfig.customer_email = userEmail;
    }

    return stripe.checkout.sessions.create(sessionConfig);
}

async function createCheckout(req, res) {
    const connection = await db.getConnection();

    try {
        await ensureOrderSchema();

        await connection.beginTransaction();

        const items = await getCartItems(connection, req.user.id);

        if (items.length === 0) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Seu carrinho está vazio.'
            });
        }

        const addressResult = await resolveCheckoutAddress(connection, req.user.id, req.body || {});

        if (addressResult.error) {
            await connection.rollback();
            return res.status(400).json({
                message: addressResult.error,
                addressRequired: Boolean(addressResult.addressRequired)
            });
        }

        for (const item of items) {
            if (item.quantity > item.stock) {
                await connection.rollback();
                return res.status(400).json({
                    message: `Quantidade indisponível para ${item.name}.`
                });
            }
        }

        const subtotal = items.reduce((sum, item) => sum + item.total, 0);
        const deliveryFee = getDeliveryFee();
        const total = subtotal + deliveryFee;
        const statusId = await getStatusId(connection, 'Aguardando pagamento');

        const [orderResult] = await connection.query(
            `INSERT INTO orders (subtotal, deliveryFee, total, fkUser, fkStatus, fkAddress)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [subtotal, deliveryFee, total, req.user.id, statusId, addressResult.addressId]
        );

        for (const item of items) {
            await connection.query(
                'INSERT INTO orderProduct (fkOrder, fkProduct, quantity, price) VALUES (?, ?, ?, ?)',
                [orderResult.insertId, item.productId, item.quantity, item.price]
            );
        }

        const order = {
            id: orderResult.insertId,
            subtotal,
            deliveryFee,
            total
        };
        const session = await createStripeCheckoutSession(req, order, items);

        await connection.query(
            'UPDATE orders SET stripeSessionId = ? WHERE id = ?',
            [session.id, order.id]
        );

        const cart = await getOrCreateCart(connection, req.user.id);
        await connection.query('DELETE FROM cartItem WHERE fkCart = ?', [cart.id]);

        await connection.commit();

        res.status(201).json({
            message: 'Pedido criado. Continue para o pagamento.',
            order: {
                ...order,
                status: 'Aguardando pagamento'
            },
            checkout: {
                sessionId: session.id,
                url: session.url
            }
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);

        if (error.type?.startsWith('Stripe') || error.raw?.message) {
            return res.status(500).json({
                message: error.raw?.message || 'Não foi possível iniciar o pagamento no Stripe.'
            });
        }

        res.status(500).json({
            message: error.message === 'STRIPE_SECRET_KEY não configurada.'
                ? error.message
                : 'Erro interno do servidor'
        });
    } finally {
        connection.release();
    }
}

async function getOrderItems(connection, orderId) {
    const [items] = await connection.query(
        `SELECT
            product.id AS productId,
            product.name,
            product.description,
            product.imgUrl,
            orderProduct.quantity,
            orderProduct.price
         FROM orderProduct
         INNER JOIN product ON product.id = orderProduct.fkProduct
         WHERE orderProduct.fkOrder = ?
         ORDER BY product.name ASC`,
        [orderId]
    );

    return items.map(mapOrderItemRow);
}

async function listUserOrders(req, res) {
    try {
        await ensureOrderSchema();
        await syncPaidStripeOrders(req.user.id);

        const [orders] = await db.query(
            `SELECT
                orders.id,
                orders.subtotal,
                orders.deliveryFee,
                orders.total,
                orders.stripeSessionId,
                orders.stripePaymentIntentId,
                orders.paidAt,
                orders.trackingCode,
                orders.createdAt,
                orders.updatedAt,
                status.name AS status,
                address.id AS addressId,
                addressTitle.name AS addressTitle,
                address.cep,
                address.logradouro,
                address.numero,
                address.bairro,
                address.complemento
             FROM orders
             INNER JOIN status ON status.id = orders.fkStatus
             INNER JOIN address ON address.id = orders.fkAddress
             INNER JOIN addressTitle ON addressTitle.id = address.fkTitle
             WHERE orders.fkUser = ?
             ORDER BY orders.createdAt DESC, orders.id DESC`,
            [req.user.id]
        );

        const mappedOrders = orders.map(mapOrderRow);

        for (const order of mappedOrders) {
            order.items = await getOrderItems(db, order.id);
        }

        res.json({
            orders: mappedOrders
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function getUserOrderById(req, res) {
    try {
        await ensureOrderSchema();
        await syncPaidStripeOrders(req.user.id);

        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: 'Pedido inválido.'
            });
        }

        const [orders] = await db.query(
            `SELECT
                orders.id,
                orders.subtotal,
                orders.deliveryFee,
                orders.total,
                orders.stripeSessionId,
                orders.stripePaymentIntentId,
                orders.paidAt,
                orders.trackingCode,
                orders.createdAt,
                orders.updatedAt,
                status.name AS status,
                address.id AS addressId,
                addressTitle.name AS addressTitle,
                address.cep,
                address.logradouro,
                address.numero,
                address.bairro,
                address.complemento
             FROM orders
             INNER JOIN status ON status.id = orders.fkStatus
             INNER JOIN address ON address.id = orders.fkAddress
             INNER JOIN addressTitle ON addressTitle.id = address.fkTitle
             WHERE orders.id = ? AND orders.fkUser = ?
             LIMIT 1`,
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            return res.status(404).json({
                message: 'Pedido não encontrado.'
            });
        }

        const order = mapOrderRow(orders[0]);
        order.items = await getOrderItems(db, order.id);

        res.json({
            order
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function confirmOrderReceived(req, res) {
    const connection = await db.getConnection();

    try {
        await ensureOrderSchema();

        const orderId = Number(req.params.id);

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: 'Pedido inválido.'
            });
        }

        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT orders.id, status.name AS status
             FROM orders
             INNER JOIN status ON status.id = orders.fkStatus
             WHERE orders.id = ? AND orders.fkUser = ?
             FOR UPDATE`,
            [orderId, req.user.id]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: 'Pedido não encontrado.'
            });
        }

        if (orders[0].status !== 'Enviado') {
            await connection.rollback();
            return res.status(400).json({
                message: 'Somente pedidos enviados podem ser marcados como recebidos.'
            });
        }

        const deliveredStatusId = await getStatusId(connection, 'Entregue');

        await connection.query(
            'UPDATE orders SET fkStatus = ? WHERE id = ?',
            [deliveredStatusId, orderId]
        );

        await connection.commit();

        res.json({
            message: 'Pedido marcado como entregue.'
        });
    } catch (error) {
        await connection.rollback();
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    } finally {
        connection.release();
    }
}

module.exports = {
    confirmOrderReceived,
    createCheckout,
    getOrderItems,
    getStatusId,
    getUserOrderById,
    listUserOrders,
    markOrderPaidFromStripeSession,
    syncPaidStripeOrders
};
