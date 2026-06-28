const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

async function register(req, res) {
    try {
        const { name, email, cpf, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Nome, email e senha são obrigatórios'
            });
        }

        const [existingUser] = await db.query(
            'SELECT id FROM User WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                message: 'O email já existe'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'INSERT INTO User (name, email, cpf, password, phone) VALUES (?, ?, ?, ?, ?)',
            [name, email, cpf || null, hashedPassword, phone || null]
        );

        res.status(201).json({
            message: 'usuário criado com sucesso'
        });

    } catch(error) {
        console.error(error);

        res.status(500).json({
            message: 'Erro interno do servidor'
        });
    }
}

async function login(req, res) {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email e senha são obrigatórios'
            });
        }

        const [users] = await db.query(
            'SELECT * FROM User WHERE email = ?',
            [email]
        );

        if(users.length === 0) {
            return res.status(401).json({
                message: 'credenciais inválidas'
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if(!validPassword) {
            return res.status(401).json({
                message: 'credenciais inválidas'
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                isAdmin: user.isAdmin
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                isAdmin: Boolean(user.isAdmin)
            }
        });

    } catch(error) {

        console.error(error);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
}

module.exports = {
    register,
    login
};
