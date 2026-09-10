const express = require('express');
const { Pool } = require('pg'); 
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Новое супер-умное подключение по одной строке DATABASE_URL
const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/school_db',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

db.connect((err) => {
    if (err) {
        console.error('❌ Ошибка подключения к PostgreSQL:', err);
        return;
    }
    console.log('✨ Успешно подключено к вечной базе данных PostgreSQL на Render!');
});

// 1. МАРШРУТ: Получить все доступные темы
app.get('/api/categories', (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results.rows);
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
        res.json(results.rows);
    });
});

// 3. МАРШРУТ: Сохранить новый отзыв (Переписано под Postgres)
app.post('/api/reviews', (req, res) => {
    const { username, rating, review_text, category_id } = req.body;
    // Используем $1, $2, $3, $4 вместо знаков ?
    const sql = 'INSERT INTO reviews (username, rating, review_text, category_id) VALUES ($1, $2, $3, $4) RETURNING id';
    
    db.query(sql, [username, rating, review_text, category_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Отзыв добавлен!', id: result.rows[0].id });
    });
});

// 4. МАРШРУТ: Удалить один отзыв (Переписано под Postgres)
app.delete('/api/reviews/:id', (req, res) => {
    const reviewId = req.params.id;
    // Используем $1 вместо знака ?
    db.query('DELETE FROM reviews WHERE id = $1', [reviewId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Отзыв удален!' });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен! Порт: ${PORT}`);
});
