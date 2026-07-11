require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoute');
const productRoutes = require('./routes/productRoute');
const { uploadsRoot } = require('./middlewares/productBodyParser');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
    res.json({ message: 'API is running' });
});

app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/uploads', express.static(uploadsRoot));

const frontendDistPath = path.join(__dirname, '../../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));

    app.get(/^(?!\/auth|\/products|\/uploads|\/health).*/, (req, res) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
