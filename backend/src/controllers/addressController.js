const db = require('../config/database');

async function getTitleId(connection, titleName = 'Casa') {
    const title = String(titleName || 'Casa').trim() || 'Casa';
    const [titles] = await connection.query(
        'SELECT id FROM addressTitle WHERE name = ? LIMIT 1',
        [title]
    );

    return titles[0]?.id || null;
}

function mapAddress(row) {
    return {
        id: row.id,
        title: row.title,
        cep: row.cep,
        logradouro: row.logradouro,
        numero: row.numero,
        bairro: row.bairro,
        complemento: row.complemento
    };
}

function validateAddressPayload(payload = {}) {
    const title = String(payload.title || payload.name || 'Casa').trim() || 'Casa';
    const cep = String(payload.cep || '').trim();
    const logradouro = String(payload.logradouro || '').trim();
    const numero = String(payload.numero || payload.number || '').trim();
    const bairro = String(payload.bairro || '').trim();
    const complemento = payload.complemento ? String(payload.complemento).trim() : null;

    if (!cep || !logradouro || !numero || !bairro) {
        return {
            error: 'CEP, logradouro, número e bairro são obrigatórios.'
        };
    }

    return {
        address: {
            title,
            cep,
            logradouro,
            numero,
            bairro,
            complemento
        }
    };
}

async function listAddresses(req, res) {
    try {
        const [addresses] = await db.query(
            `SELECT
                address.id,
                addressTitle.name AS title,
                address.cep,
                address.logradouro,
                address.numero,
                address.bairro,
                address.complemento
             FROM address
             INNER JOIN addressTitle ON addressTitle.id = address.fkTitle
             WHERE address.fkUser = ?
             ORDER BY address.id DESC`,
            [req.user.id]
        );

        res.json({
            addresses: addresses.map(mapAddress)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function listAddressTitles(req, res) {
    try {
        const [titles] = await db.query(
            'SELECT id, name FROM addressTitle ORDER BY id ASC'
        );

        res.json({
            titles
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function createAddress(req, res) {
    const connection = await db.getConnection();

    try {
        const { error, address } = validateAddressPayload(req.body);

        if (error) {
            return res.status(400).json({
                message: error
            });
        }

        await connection.beginTransaction();

        const titleId = await getTitleId(connection, address.title);

        if (!titleId) {
            await connection.rollback();
            return res.status(400).json({
                message: 'Escolha um título de endereço válido.'
            });
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
                req.user.id,
                titleId
            ]
        );

        await connection.commit();

        res.status(201).json({
            message: 'Endereço cadastrado com sucesso.',
            address: {
                id: result.insertId,
                ...address
            }
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
    createAddress,
    getTitleId,
    listAddresses,
    listAddressTitles,
    validateAddressPayload
};
