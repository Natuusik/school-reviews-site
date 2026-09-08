const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// Умный порт: берет порт хостинга в интернете, либо 3000 для дома
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Умное подключение: если сайт в интернете, берет доступы из настроек Render. 
// Если запускаете дома — автоматически подставляет ваш домашний root и 123456!
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456', 
    database: process.env.DB_NAME || 'minisite_db',
    port: process.env.DB_PORT || 3306
});

db.connect((err) => {
    if (err) {
        // Выводим полную ошибку, чтобы её было видно в логах
        console.error('❌ Ошибка подключения к MySQL:', err);
        return;
    }
    console.log('✨ Успешно подключено к базе данных MySQL!');
});

// 1. МАРШРУТ: Получить все доступные темы
app.get('/api/categories', (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. МАРШРУТ: Получить все отзывы
app.get('/api/reviews', (req, res) => {
    const sql = `
        SELECT reviews.*, categories.name AS category_name 
        FROM reviews 
        LEFT JOIN categories ON reviews.category_id = categories.id 
        ORDER BY reviews.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 3. МАРШРУТ: Сохранить новый отзыв
app.post('/api/reviews', (req, res) => {
    const { username, rating, review_text, category_id } = req.body;
    const sql = 'INSERT INTO reviews (username, rating, review_text, category_id) VALUES (?, ?, ?, ?)';
    
    db.query(sql, [username, rating, review_text, category_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Отзыв добавлен!', id: result.insertId });
    });
});

// 4. МАРШРУТ: Удалить один отзыв (пароль: школа2026)
app.delete('/api/reviews/:id', (req, res) => {
    const reviewId = req.params.id;
    db.query('DELETE FROM reviews WHERE id = ?', [reviewId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Отзыв удален!' });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен! Порт: ${PORT}`);
});
