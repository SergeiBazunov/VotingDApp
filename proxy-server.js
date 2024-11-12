const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const multer = require('multer');
const upload = multer();

const app = express();

// Увеличиваем лимиты для обработки больших файлов
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Настройки CORS
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['*'],
    credentials: true
}));

// Добавляем обработку multipart/form-data
app.use(upload.any());

// Настройки прокси с увеличенными таймаутами
const proxyOptions = {
    target: 'http://localhost:5001',
    changeOrigin: true,
    pathRewrite: {
        '^/ipfs': '/api/v0'
    },
    timeout: 300000, // 5 минут
    proxyTimeout: 300000, // 5 минут
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000';
        proxyRes.headers['Access-Control-Allow-Methods'] = '*';
        proxyRes.headers['Access-Control-Allow-Headers'] = '*';
        proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
    },
    onError: (err, req, res) => {
        console.error('Proxy error:', err);
        res.status(500).json({
            error: 'Proxy Error',
            details: err.message
        });
    }
};

// Добавляем логирование
app.use((req, res, next) => {
    console.log('Incoming request:', {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
    });
    next();
});

app.use('/ipfs', createProxyMiddleware(proxyOptions));

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({
        error: 'Server Error',
        details: err.message
    });
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Proxy server running on port ${PORT}`);
}); 