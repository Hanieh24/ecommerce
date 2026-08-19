const db = require('../config/database');
const { ensureOrderSchema } = require('../services/orderSchemaService');

async function getOrCreateCart(connection, userId) {
    await connection.query(
        'INSERT IGNORE INTO cart (fkUser) VALUES (?)',
        [userId]
    );

    const [carts] = await connection.query(
        'SELECT id FROM cart WHERE fkUser = ? LIMIT 1',
        [userId]
    );

    return carts[0];
}

function mapCartItem(row) {
    const imgUrl = row.imgUrl || null;
    const price = Number(row.price || 0);
    const quantity = Number(row.quantity || 0);

    return {
        productId: row.productId,
        name: row.name,
        description: row.description,
        price,
        imgUrl,
        imageUrl: imgUrl,
        stock: row.stock,
        quantity,
        total: price * quantity
    };
}

function summarizeCart(items) {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);

    return {
        items,
        subtotal,
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
    };
}

async function getCartItems(connection, userId) {
    const [items] = await connection.query(
        `SELECT
            product.id AS productId,
            product.name,
            product.description,
            product.price,
            product.imgUrl,
            product.stock,
            cartItem.quantity
         FROM cart
         INNER JOIN cartItem ON cartItem.fkCart = cart.id
         INNER JOIN product ON product.id = cartItem.fkProduct
         WHERE cart.fkUser = ? AND product.deletedAt IS NULL
         ORDER BY cartItem.createdAt DESC`,
        [userId]
    );

    return items.map(mapCartItem);
}

async function getCart(req, res) {
    try {
        await ensureOrderSchema();
        const items = await getCartItems(db, req.user.id);

        res.json({
            cart: summarizeCart(items)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function addCartItem(req, res) {
    const connection = await db.getConnection();

    try {
        await ensureOrderSchema();

        const productId = Number(req.body.productId);
        const quantity = Number(req.body.quantity || 1);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                message: 'Produto inválido.'
            });
        }

        if (!Number.isInteger(quantity) || quantity <= 0) {
            return res.status(400).json({
                message: 'Quantidade inválida.'
            });
        }

        await connection.beginTransaction();

        const [products] = await connection.query(
            'SELECT id, stock FROM product WHERE id = ? AND deletedAt IS NULL LIMIT 1',
            [productId]
        );

        if (products.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                message: 'Produto não encontrado.'
            });
        }

        const cart = await getOrCreateCart(connection, req.user.id);

        const [currentItems] = await connection.query(
            'SELECT quantity FROM cartItem WHERE fkCart = ? AND fkProduct = ? LIMIT 1',
            [cart.id, productId]
        );
        const currentQuantity = currentItems[0]?.quantity || 0;
        const nextQuantity = currentQuantity + quantity;

        if (nextQuantity > products[0].stock) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Quantidade maior que o estoque disponível.'
            });
        }

        await connection.query(
            `INSERT INTO cartItem (fkCart, fkProduct, quantity)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updatedAt = CURRENT_TIMESTAMP`,
            [cart.id, productId, nextQuantity]
        );

        const items = await getCartItems(connection, req.user.id);
        await connection.commit();

        res.status(201).json({
            message: 'Produto adicionado ao carrinho.',
            cart: summarizeCart(items)
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

async function updateCartItem(req, res) {
    const connection = await db.getConnection();

    try {
        await ensureOrderSchema();

        const productId = Number(req.params.productId);
        const quantity = Number(req.body.quantity);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                message: 'Produto inválido.'
            });
        }

        if (!Number.isInteger(quantity) || quantity < 0) {
            return res.status(400).json({
                message: 'Quantidade inválida.'
            });
        }

        await connection.beginTransaction();

        const cart = await getOrCreateCart(connection, req.user.id);

        if (quantity === 0) {
            await connection.query(
                'DELETE FROM cartItem WHERE fkCart = ? AND fkProduct = ?',
                [cart.id, productId]
            );
        } else {
            const [products] = await connection.query(
                'SELECT id, stock FROM product WHERE id = ? AND deletedAt IS NULL LIMIT 1',
                [productId]
            );

            if (products.length === 0) {
                await connection.rollback();
                return res.status(404).json({
                    message: 'Produto não encontrado.'
                });
            }

            if (quantity > products[0].stock) {
                await connection.rollback();
                return res.status(400).json({
                    message: 'Quantidade maior que o estoque disponível.'
                });
            }

            await connection.query(
                `INSERT INTO cartItem (fkCart, fkProduct, quantity)
                 VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), updatedAt = CURRENT_TIMESTAMP`,
                [cart.id, productId, quantity]
            );
        }

        const items = await getCartItems(connection, req.user.id);
        await connection.commit();

        res.json({
            message: 'Carrinho atualizado.',
            cart: summarizeCart(items)
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

async function removeCartItem(req, res) {
    const connection = await db.getConnection();

    try {
        await ensureOrderSchema();

        const productId = Number(req.params.productId);

        if (!Number.isInteger(productId) || productId <= 0) {
            return res.status(400).json({
                message: 'Produto inválido.'
            });
        }

        await connection.beginTransaction();
        const cart = await getOrCreateCart(connection, req.user.id);

        await connection.query(
            'DELETE FROM cartItem WHERE fkCart = ? AND fkProduct = ?',
            [cart.id, productId]
        );

        const items = await getCartItems(connection, req.user.id);
        await connection.commit();

        res.json({
            message: 'Produto removido do carrinho.',
            cart: summarizeCart(items)
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

async function clearCart(req, res) {
    const connection = await db.getConnection();

    try {
        await ensureOrderSchema();
        await connection.beginTransaction();

        const cart = await getOrCreateCart(connection, req.user.id);
        await connection.query('DELETE FROM cartItem WHERE fkCart = ?', [cart.id]);

        await connection.commit();

        res.json({
            message: 'Carrinho limpo.',
            cart: summarizeCart([])
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
    addCartItem,
    clearCart,
    getCart,
    getCartItems,
    getOrCreateCart,
    removeCartItem,
    summarizeCart,
    updateCartItem
};
