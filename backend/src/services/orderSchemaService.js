const db = require('../config/database');

let schemaReady;

const orderColumnMigrations = [
    ['subtotal', 'ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER id'],
    ['deliveryFee', 'ALTER TABLE orders ADD COLUMN deliveryFee DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER subtotal'],
    ['stripeSessionId', 'ALTER TABLE orders ADD COLUMN stripeSessionId VARCHAR(255) NULL AFTER total'],
    ['stripePaymentIntentId', 'ALTER TABLE orders ADD COLUMN stripePaymentIntentId VARCHAR(255) NULL AFTER stripeSessionId'],
    ['paidAt', 'ALTER TABLE orders ADD COLUMN paidAt DATETIME NULL AFTER stripePaymentIntentId'],
    ['trackingCode', 'ALTER TABLE orders ADD COLUMN trackingCode VARCHAR(80) NULL AFTER paidAt'],
    ['updatedAt', 'ALTER TABLE orders ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt']
];
const requiredStatuses = [
    'Pendente',
    'Aguardando pagamento',
    'Pago',
    'Em Separacao',
    'Rejeitado',
    'Enviado',
    'Entregue',
    'Cancelado'
];

async function ensureOrderSchema() {
    if (!schemaReady) {
        schemaReady = (async () => {
            const [orderColumns] = await db.query(
                `SELECT COLUMN_NAME
                 FROM INFORMATION_SCHEMA.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'orders'`
            );
            const existingOrderColumnNames = orderColumns.map((column) => column.COLUMN_NAME);

            for (const [columnName, alterStatement] of orderColumnMigrations) {
                if (!existingOrderColumnNames.includes(columnName)) {
                    await db.query(alterStatement);
                }
            }

            await db.query(`
                CREATE TABLE IF NOT EXISTS cart (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    fkUser INT NOT NULL UNIQUE,
                    CONSTRAINT fk_cart_user
                        FOREIGN KEY (fkUser) REFERENCES User(id)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE
                )
            `);

            await db.query(`
                CREATE TABLE IF NOT EXISTS cartItem (
                    fkCart INT NOT NULL,
                    fkProduct INT NOT NULL,
                    quantity INT NOT NULL,
                    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    PRIMARY KEY (fkCart, fkProduct),
                    CONSTRAINT fk_cart_item_cart
                        FOREIGN KEY (fkCart) REFERENCES cart(id)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE,
                    CONSTRAINT fk_cart_item_product
                        FOREIGN KEY (fkProduct) REFERENCES product(id)
                        ON DELETE CASCADE
                        ON UPDATE CASCADE
                )
            `);

            for (const status of requiredStatuses) {
                const [existingStatuses] = await db.query(
                    'SELECT id FROM status WHERE name = ? LIMIT 1',
                    [status]
                );

                if (existingStatuses.length === 0) {
                    await db.query('INSERT INTO status (name) VALUES (?)', [status]);
                }
            }
        })().catch((error) => {
            schemaReady = null;
            throw error;
        });
    }

    return schemaReady;
}

module.exports = {
    ensureOrderSchema
};
