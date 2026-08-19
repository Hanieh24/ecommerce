const db = require('../config/database');
const { getOrderItems, getStatusId } = require('./orderController');
const { mapOrderRow } = require('../services/orderMapper');
const { ensureOrderSchema } = require('../services/orderSchemaService');

const allowedStatuses = new Set([
    'Rejeitado',
    'Em Separacao',
    'Enviado',
    'Entregue',
    'Cancelado'
]);
const acceptedStatuses = new Set(['Aceito', 'Em separação', 'Em separacao', 'Em Separacao', 'Enviado', 'Entregue']);
const separatingStatuses = new Set(['Aceito', 'Em separação', 'Em separacao', 'Em Separacao']);

async function listOrders(req, res) {
    try {
        await ensureOrderSchema();

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
                User.id AS userId,
                User.name AS userName,
                User.email AS userEmail,
                address.id AS addressId,
                addressTitle.name AS addressTitle,
                address.cep,
                address.logradouro,
                address.numero,
                address.bairro,
                address.complemento
             FROM orders
             INNER JOIN status ON status.id = orders.fkStatus
             INNER JOIN User ON User.id = orders.fkUser
             INNER JOIN address ON address.id = orders.fkAddress
             INNER JOIN addressTitle ON addressTitle.id = address.fkTitle
             WHERE status.name <> 'Aguardando pagamento'
             ORDER BY orders.createdAt DESC, orders.id DESC`
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

async function getOrderById(req, res) {
    try {
        await ensureOrderSchema();

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
                User.id AS userId,
                User.name AS userName,
                User.email AS userEmail,
                address.id AS addressId,
                addressTitle.name AS addressTitle,
                address.cep,
                address.logradouro,
                address.numero,
                address.bairro,
                address.complemento
             FROM orders
             INNER JOIN status ON status.id = orders.fkStatus
             INNER JOIN User ON User.id = orders.fkUser
             INNER JOIN address ON address.id = orders.fkAddress
             INNER JOIN addressTitle ON addressTitle.id = address.fkTitle
             WHERE orders.id = ?
             LIMIT 1`,
            [orderId]
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

async function updateOrderStatus(req, res) {
    const connection = await db.getConnection();

    try {
        await ensureOrderSchema();

        const orderId = Number(req.params.id);
        const status = String(req.body.status || '').trim();
        const trackingCode = String(req.body.trackingCode || '').trim();

        if (!Number.isInteger(orderId) || orderId <= 0) {
            return res.status(400).json({
                message: 'Pedido inválido.'
            });
        }

        if (!allowedStatuses.has(status)) {
            return res.status(400).json({
                message: 'Status inválido.'
            });
        }

        if (status === 'Enviado' && trackingCode.length === 0) {
            return res.status(400).json({
                message: 'Informe o código de postagem.'
            });
        }

        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT orders.id, status.name AS status
             FROM orders
             INNER JOIN status ON status.id = orders.fkStatus
             WHERE orders.id = ?
             FOR UPDATE`,
            [orderId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: 'Pedido não encontrado.'
            });
        }

        if (status === 'Em Separacao' && orders[0].status !== 'Pago') {
            await connection.rollback();
            return res.status(400).json({
                message: 'Somente pedidos pagos podem ser aceitos.'
            });
        }

        if (status === 'Enviado' && !separatingStatuses.has(orders[0].status)) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Somente pedidos em separação podem ser enviados.'
            });
        }

        if (status === 'Em Separacao' && !acceptedStatuses.has(orders[0].status)) {
            const [items] = await connection.query(
                `SELECT
                    orderProduct.fkProduct,
                    orderProduct.quantity,
                    product.name,
                    product.stock
                 FROM orderProduct
                 INNER JOIN product ON product.id = orderProduct.fkProduct
                 WHERE orderProduct.fkOrder = ?
                 FOR UPDATE`,
                [orderId]
            );

            for (const item of items) {
                if (item.quantity > item.stock) {
                    await connection.rollback();
                    return res.status(400).json({
                        message: `Estoque insuficiente para ${item.name}.`
                    });
                }
            }

            for (const item of items) {
                await connection.query(
                    'UPDATE product SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.fkProduct]
                );
            }
        }

        if ((status === 'Rejeitado' || status === 'Cancelado') && acceptedStatuses.has(orders[0].status)) {
            const [items] = await connection.query(
                `SELECT fkProduct, quantity
                 FROM orderProduct
                 WHERE fkOrder = ?`,
                [orderId]
            );

            for (const item of items) {
                await connection.query(
                    'UPDATE product SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.fkProduct]
                );
            }
        }

        const statusId = await getStatusId(connection, status);

        if (status === 'Enviado') {
            await connection.query(
                'UPDATE orders SET fkStatus = ?, trackingCode = ? WHERE id = ?',
                [statusId, trackingCode, orderId]
            );
        } else {
            await connection.query(
                'UPDATE orders SET fkStatus = ? WHERE id = ?',
                [statusId, orderId]
            );
        }

        await connection.commit();

        res.json({
            message: `Pedido atualizado para ${status}.`
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

function acceptOrder(req, res) {
    req.body = req.body || {};
    req.body.status = 'Em Separacao';
    return updateOrderStatus(req, res);
}

function rejectOrder(req, res) {
    req.body = req.body || {};
    req.body.status = 'Rejeitado';
    return updateOrderStatus(req, res);
}

module.exports = {
    acceptOrder,
    getOrderById,
    listOrders,
    rejectOrder,
    updateOrderStatus
};
