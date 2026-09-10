const express = require('express');
const { Pool } = require('pg'); 
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// 1. Создаем переменную db для подключения к базе данных
const db = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:123456@localhost:5432/school_db',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ТАБЛИЦ И БЕЗОПАСНОЕ ОБНОВЛЕНИЕ ТЕМ ПРИ СТАРТЕ СЕРВЕРА
async function initDatabase() {
    try {
        // Создаем таблицу категорий, если её нет
        await db.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );
        `);
        
        // Создаем таблицу отзывов, если её нет
        await db.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                rating INT NOT NULL,
                review_text TEXT NOT NULL,
                category_id INT REFERENCES categories(id) ON DELETE SET NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 3. Безопасное обновление тем: меняет названия по ID, но бережно сохраняет все старые отзывы!
        await db.query("INSERT INTO categories (id, name) VALUES (1, '🍉 Школьная столовая') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        await db.query("INSERT INTO categories (id, name) VALUES (2, '📚 Уроки и обучение') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        await db.query("INSERT INTO categories (id, name) VALUES (3, '🎭 Мероприятия и праздники') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        await db.query("INSERT INTO categories (id, name) VALUES (4, '⚽ Спортивные секции и кружки') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        await db.query("INSERT INTO categories (id, name) VALUES (5, '💡 Общие предложения') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        
        console.log('✨ База данных успешно проверена, новые темы применились без потери отзывов!');
    } catch (err) {
        console.error('❌ Ошибка автоматической настройки таблиц:', err.message);
    }
}

db.connect((err) => {
    if (err) {
        console.error('❌ Ошибка подключения к PostgreSQL:', err);
        return;
    }
    console.log('✨ Успешно подключено к базе данных PostgreSQL на Render!');
    initDatabase(); // Запускаем проверку структуры сразу после успешного подключения
});
// 1. МАРШРУТ: Получить все доступные темы
app.get('/api/categories', (req, res) => {
    db.query('SELECT * FROM categories ORDER BY id ASC', (err, results) => {
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

// 3. МАРШРУТ: Сохранить новый отзыв
app.post('/api/reviews', (req, res) => {
    const { username, rating, review_text, category_id } = req.body;
    const sql = 'INSERT INTO reviews (username, rating, review_text, category_id) VALUES ($1, $2, $3, $4) RETURNING id';
    
    db.query(sql, [username, rating, review_text, category_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Отзыв добавлен!', id: result.rows.id });
    });
});

// 4. МАРШРУТ: Удалить один отзыв
app.delete('/api/reviews/:id', (req, res) => {
    const reviewId = req.params.id;
    db.query('DELETE FROM reviews WHERE id = $1', [reviewId], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Отзыв удален!' });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен! Порт: ${PORT}`);
});
