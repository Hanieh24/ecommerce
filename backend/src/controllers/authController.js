const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        const [existingUser] = await db.query(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({
                message: 'Email already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            `
            INSERT INTO user
            (name, email, password)
            VALUES (?, ?, ?)
            `,
            [name, email, hashedPassword]
        );

        res.status(201).json({
            message: 'User created successfully'
        });

    } catch(error) {
        console.error(error);

        res.status(500).json({
            message: 'Internal server error'
        });
    }
}

async function login(req, res) {

    try {

        const { email, password } = req.body;

        const [users] = await db.query(
            'SELECT * FROM user WHERE email = ?',
            [email]
        );

        if(users.length === 0) {
            return res.status(401).json({
                message: 'Invalid credentials'
            });
        }

        const user = users[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if(!validPassword) {
            return res.status(401).json({
                message: 'Invalid credentials'
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
            token
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