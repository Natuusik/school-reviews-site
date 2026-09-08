const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Nat@123456', 
    database: 'minisite_db'
});

db.connect((err) => {
    if (err) {
        console.error('Ошибка подключения к MySQL:', err.message);
        return;
    }
    console.log('✨ Успешно подключено к базе данных MySQL!');
});

// 1. МАРШРУТ: Получить все доступные темы для формы
app.get('/api/categories', (req, res) => {
    db.query('SELECT * FROM categories', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 2. МАРШРУТ: Получить все отзывы вместе с названиями их тем
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

// 3. МАРШРУТ: Сохранить новый отзыв (теперь с category_id)
app.post('/api/reviews', (req, res) => {
    const { username, rating, review_text, category_id } = req.body;
    const sql = 'INSERT INTO reviews (username, rating, review_text, category_id) VALUES (?, ?, ?, ?)';
    
    db.query(sql, [username, rating, review_text, category_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Отзыв добавлен!', id: result.insertId });
    });
});

// 4. МАРШРУТ: Удалить один отзыв
app.delete('/api/reviews/:id', (req, res) => {
    const reviewId = req.params.id;
    db.query('DELETE FROM reviews WHERE id = ?', [reviewId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Отзыв удален!' });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен! Откройте в браузере: http://localhost:${PORT}`);
});
