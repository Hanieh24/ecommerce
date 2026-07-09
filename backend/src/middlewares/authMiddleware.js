const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: 'Token não informado'
        });
    }

    const [type, token] = authHeader.split(' ');

    if (type !== 'Bearer' || !token) {
        return res.status(401).json({
            message: 'Formato do token inválido'
        });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (error) {
        return res.status(401).json({
            message: 'Token inválido'
        });
    }
}

function requireAdmin(req, res, next) {
    if (!req.user?.isAdmin) {
        return res.status(403).json({
            message: 'Acesso de administrador necessário'
        });
    }

    next();
}

module.exports = {
    authenticate,
    requireAdmin
};
