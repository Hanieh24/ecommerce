require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const db = require('../config/database');

async function setupDatabase() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    const statements = schema
        .split(';')
        .map((statement) => statement.trim())
        .filter(Boolean);

    for (const statement of statements) {
        await db.query(statement);
    }

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

    const orderColumns = [
        ['subtotal', 'ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER id'],
        ['deliveryFee', 'ALTER TABLE orders ADD COLUMN deliveryFee DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER subtotal'],
        ['stripeSessionId', 'ALTER TABLE orders ADD COLUMN stripeSessionId VARCHAR(255) NULL AFTER total'],
        ['stripePaymentIntentId', 'ALTER TABLE orders ADD COLUMN stripePaymentIntentId VARCHAR(255) NULL AFTER stripeSessionId'],
        ['paidAt', 'ALTER TABLE orders ADD COLUMN paidAt DATETIME NULL AFTER stripePaymentIntentId'],
        ['trackingCode', 'ALTER TABLE orders ADD COLUMN trackingCode VARCHAR(80) NULL AFTER paidAt'],
        ['updatedAt', 'ALTER TABLE orders ADD COLUMN updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt']
    ];

    const [existingOrderColumns] = await db.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'orders'`
    );
    const existingOrderColumnNames = existingOrderColumns.map((column) => column.COLUMN_NAME);

    for (const [columnName, alterStatement] of orderColumns) {
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

    for (const statusName of requiredStatuses) {
        const [existingStatuses] = await db.query(
            'SELECT id FROM status WHERE name = ? LIMIT 1',
            [statusName]
        );

        if (existingStatuses.length === 0) {
            await db.query('INSERT INTO status (name) VALUES (?)', [statusName]);
        }
    }

    await db.end();
    console.log('Database schema created successfully');
}

setupDatabase().catch(async (error) => {
    console.error('Database setup failed:', error);
    await db.end();
    process.exit(1);
});
