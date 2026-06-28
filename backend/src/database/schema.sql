CREATE TABLE IF NOT EXISTS User (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    cpf VARCHAR(14) UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    isAdmin TINYINT(1) NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS addressTitle (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(45) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS address (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cep VARCHAR(10) NOT NULL,
    logradouro VARCHAR(150) NOT NULL,
    numero VARCHAR(10) NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    complemento VARCHAR(100),
    fkUser INT NOT NULL,
    fkTitle INT NOT NULL,
    CONSTRAINT fk_address_user
        FOREIGN KEY (fkUser) REFERENCES User(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_address_title
        FOREIGN KEY (fkTitle) REFERENCES addressTitle(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(45) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS product (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    price DECIMAL(10, 2) NOT NULL,
    `img-url` VARCHAR(500),
    stock INT NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fkUser INT NOT NULL,
    fkStatus INT NOT NULL,
    fkAddress INT NOT NULL,
    CONSTRAINT fk_orders_user
        FOREIGN KEY (fkUser) REFERENCES User(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_orders_status
        FOREIGN KEY (fkStatus) REFERENCES status(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    CONSTRAINT fk_orders_address
        FOREIGN KEY (fkAddress) REFERENCES address(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS orderProduct (
    fkOrder INT NOT NULL,
    fkProduct INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (fkOrder, fkProduct),
    CONSTRAINT fk_order_product_order
        FOREIGN KEY (fkOrder) REFERENCES orders(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_order_product_product
        FOREIGN KEY (fkProduct) REFERENCES product(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

INSERT IGNORE INTO addressTitle (name)
VALUES ('Casa'), ('Trabalho'), ('Outro');

INSERT IGNORE INTO status (name)
VALUES ('Pendente'), ('Pago'), ('Enviado'), ('Entregue'), ('Cancelado');
