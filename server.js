// АВТОМАТИЧЕСКОЕ СОЗДАНИЕ ТАБЛИЦ И БЕЗОПАСНОЕ ОБНОВЛЕНИЕ ТЕМ ПРИ СТАРТЕ СЕРВЕРА
async function initDatabase() {
    try {
        // 1. Создаем таблицу категорий, если её нет
        await db.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL
            );
        `);
        
        // 2. Создаем таблицу отзывов, если её нет
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
        await db.query("INSERT INTO categories (id, name) VALUES (1, '🎬 Фильмы и сериалы') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        await db.query("INSERT INTO categories (id, name) VALUES (2, '🎮 Компьютерные игры') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        await db.query("INSERT INTO categories (id, name) VALUES (3, '🎵 Музыка и треки') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        await db.query("INSERT INTO categories (id, name) VALUES (4, '🍕 Еда и рецепты') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        await db.query("INSERT INTO categories (id, name) VALUES (5, '📱 Гаджеты и технологии') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;");
        
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
