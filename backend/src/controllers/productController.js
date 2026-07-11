const db = require('../config/database');

let productSchemaReady;

async function ensureProductSchema() {
    if (!productSchemaReady) {
        productSchemaReady = (async () => {
            const [columns] = await db.query(
                `SELECT COLUMN_NAME
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'product'
                    AND COLUMN_NAME = 'deletedAt'`
            );

            if (columns.length === 0) {
                await db.query('ALTER TABLE product ADD COLUMN deletedAt DATETIME NULL');
            }
        })().catch((error) => {
            productSchemaReady = null;
            throw error;
        });
    }

    return productSchemaReady;
}

function mapProduct(row) {
    const imgUrl = row.imgUrl || null;

    return {
        id: row.id,
        name: row.name,
        description: row.description,
        price: Number(row.price),
        imgUrl,
        imageUrl: imgUrl,
        stock: row.stock,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt
    };
}

function validateProductPayload(body) {
    const payload = body || {};
    const name = String(payload.name || '').trim();
    const description = payload.description ? String(payload.description).trim() : null;
    const imgUrl = payload.imgUrl || payload.imageUrl || payload['img-url'] || null;
    const price = Number(payload.price);
    const stock = Number(payload.stock);

    if (!name) {
        return { error: 'Nome do produto é obrigatório.' };
    }

    if (payload.price === undefined || payload.price === '' || !Number.isFinite(price) || price < 0) {
        return { error: 'Preço do produto deve ser um número válido.' };
    }

    if (payload.stock === undefined || payload.stock === '' || !Number.isInteger(stock) || stock < 0) {
        return { error: 'Estoque do produto deve ser um número inteiro válido.' };
    }

    return {
        product: {
            name,
            description,
            price,
            stock,
            imgUrl: imgUrl ? String(imgUrl).trim() : null
        }
    };
}

async function listProducts(req, res) {
    try {
        await ensureProductSchema();

        const [products] = await db.query(
            `SELECT
                id,
                name,
                description,
                price,
                \`img-url\` AS imgUrl,
                stock,
                createdAt,
                updatedAt
             FROM product
             WHERE deletedAt IS NULL
             ORDER BY createdAt DESC, id DESC`
        );

        res.json({
            products: products.map(mapProduct)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function getProductById(req, res) {
    try {
        await ensureProductSchema();

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Produto inválido.'
            });
        }

        const [products] = await db.query(
            `SELECT
                id,
                name,
                description,
                price,
                \`img-url\` AS imgUrl,
                stock,
                createdAt,
                updatedAt
             FROM product
             WHERE id = ? AND deletedAt IS NULL
             LIMIT 1`,
            [id]
        );

        if (products.length === 0) {
            return res.status(404).json({
                message: 'Produto não encontrado.'
            });
        }

        res.json({
            product: mapProduct(products[0])
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function createProduct(req, res) {
    try {
        await ensureProductSchema();

        const { error, product } = validateProductPayload(req.body);

        if (error) {
            return res.status(400).json({
                message: error
            });
        }

        const [result] = await db.query(
            'INSERT INTO product (name, description, price, `img-url`, stock) VALUES (?, ?, ?, ?, ?)',
            [product.name, product.description, product.price, product.imgUrl, product.stock]
        );

        const [products] = await db.query(
            `SELECT
                id,
                name,
                description,
                price,
                \`img-url\` AS imgUrl,
                stock,
                createdAt,
                updatedAt
             FROM product
             WHERE id = ?
             LIMIT 1`,
            [result.insertId]
        );

        res.status(201).json({
            message: 'Produto criado com sucesso.',
            product: mapProduct(products[0])
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function updateProduct(req, res) {
    try {
        await ensureProductSchema();

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Produto inválido.'
            });
        }

        const { error, product } = validateProductPayload(req.body);

        if (error) {
            return res.status(400).json({
                message: error
            });
        }

        const [result] = await db.query(
            `UPDATE product
             SET name = ?, description = ?, price = ?, \`img-url\` = ?, stock = ?
             WHERE id = ? AND deletedAt IS NULL`,
            [product.name, product.description, product.price, product.imgUrl, product.stock, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Produto não encontrado.'
            });
        }

        const [products] = await db.query(
            `SELECT
                id,
                name,
                description,
                price,
                \`img-url\` AS imgUrl,
                stock,
                createdAt,
                updatedAt
             FROM product
             WHERE id = ?
             LIMIT 1`,
            [id]
        );

        res.json({
            message: 'Produto atualizado com sucesso.',
            product: mapProduct(products[0])
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function deleteProduct(req, res) {
    try {
        await ensureProductSchema();

        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: 'Produto inválido.'
            });
        }

        const [result] = await db.query(
            'UPDATE product SET deletedAt = CURRENT_TIMESTAMP WHERE id = ? AND deletedAt IS NULL',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Produto não encontrado.'
            });
        }

        res.json({
            message: 'Produto removido com sucesso.'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

module.exports = {
    listProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};
