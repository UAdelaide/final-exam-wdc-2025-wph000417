const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = 3000;

// 数据库连接配置
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456', // 使用空密码
  database: 'DogWalkService',
  multipleStatements: false // 禁用多语句查询
};

let connection;

// 初始化数据库连接和示例数据
async function initDatabase() {
  try {
    // 创建连接
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database successfully');

    // 插入用户数据 - 每个INSERT单独执行
    await connection.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES ('alice123', 'alice@example.com', 'hashed123', 'owner')
    `);
    
    await connection.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES ('bobwalker', 'bob@example.com', 'hashed456', 'walker')
    `);
    
    await connection.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES ('carol123', 'carol@example.com', 'hashed789', 'owner')
    `);
    
    await connection.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES ('david456', 'david@example.com', 'hashed101', 'walker')
    `);
    
    await connection.query(`
      INSERT INTO Users (username, email, password_hash, role)
      VALUES ('emma789', 'emma@example.com', 'hashed202', 'owner')
    `);

    // 插入狗的数据 - 每个INSERT单独执行
    await connection.query(`
      INSERT INTO Dogs (owner_id, name, size)
      SELECT user_id, 'Max', 'medium'
      FROM Users
      WHERE username = 'alice123'
    `);
    
    await connection.query(`
      INSERT INTO Dogs (owner_id, name, size)
      SELECT user_id, 'Bella', 'small'
      FROM Users
      WHERE username = 'carol123'
    `);
    
    await connection.query(`
      INSERT INTO Dogs (owner_id, name, size)
      SELECT user_id, 'Rocky', 'large'
      FROM Users
      WHERE username = 'alice123'
    `);
    
    await connection.query(`
      INSERT INTO Dogs (owner_id, name, size)
      SELECT user_id, 'Daisy', 'small'
      FROM Users
      WHERE username = 'emma789'
    `);
    
    await connection.query(`
      INSERT INTO Dogs (owner_id, name, size)
      SELECT user_id, 'Charlie', 'medium'
      FROM Users
      WHERE username = 'emma789'
    `);

    // 插入遛狗请求 - 每个INSERT单独执行
    await connection.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
      SELECT d.dog_id, '2025-06-10 08:00:00', 30, 'Parklands', 'open'
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
      WHERE u.username = 'alice123' AND d.name = 'Max'
    `);
    
    await connection.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
      SELECT d.dog_id, '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
      WHERE u.username = 'carol123' AND d.name = 'Bella'
    `);
    
    await connection.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
      SELECT d.dog_id, '2025-06-11 14:00:00', 60, 'Central Park', 'open'
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
      WHERE u.username = 'alice123' AND d.name = 'Rocky'
    `);
    
    await connection.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
      SELECT d.dog_id, '2025-06-12 10:15:00', 40, 'River Walk', 'completed'
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
      WHERE u.username = 'emma789' AND d.name = 'Daisy'
    `);
    
    await connection.query(`
      INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status)
      SELECT d.dog_id, '2025-06-13 16:30:00', 50, 'Mountain Trail', 'cancelled'
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
      WHERE u.username = 'emma789' AND d.name = 'Charlie'
    `);
    
    // 插入一些遛狗申请和评分用于测试 - 每个INSERT单独执行
    await connection.query(`
      -- 为bobwalker添加遛狗申请并接受
      INSERT INTO WalkApplications (request_id, walker_id, status)
      SELECT r.request_id, u.user_id, 'accepted'
      FROM WalkRequests r
      JOIN Dogs d ON r.dog_id = d.dog_id
      JOIN Users u ON u.username = 'bobwalker'
      WHERE r.status = 'completed' AND d.name = 'Daisy'
    `);
    
    await connection.query(`
      -- 添加评分
      INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments)
      SELECT r.request_id, w.user_id, o.user_id, 4, 'Good service'
      FROM WalkRequests r
      JOIN Dogs d ON r.dog_id = d.dog_id
      JOIN Users o ON d.owner_id = o.user_id
      JOIN Users w ON w.username = 'bobwalker'
      WHERE r.status = 'completed' AND d.name = 'Daisy'
    `);
    
    await connection.query(`
      -- 为david456添加遛狗申请并接受另一个请求
      INSERT INTO WalkApplications (request_id, walker_id, status)
      SELECT r.request_id, u.user_id, 'accepted'
      FROM WalkRequests r
      JOIN Dogs d ON r.dog_id = d.dog_id
      JOIN Users u ON u.username = 'david456'
      WHERE r.status = 'cancelled' AND d.name = 'Charlie'
    `);
    
    await connection.query(`
      -- 添加另一个评分
      INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments)
      SELECT r.request_id, w.user_id, o.user_id, 5, 'Excellent service'
      FROM WalkRequests r
      JOIN Dogs d ON r.dog_id = d.dog_id
      JOIN Users o ON d.owner_id = o.user_id
      JOIN Users w ON w.username = 'david456'
      WHERE r.status = 'cancelled' AND d.name = 'Charlie'
    `);

    console.log('Test data inserted successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

// 路由1：获取所有狗的列表，包括尺寸和主人用户名
app.get('/api/dogs', async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT d.name AS dog_name, d.size, u.username AS owner_username
      FROM Dogs d
      JOIN Users u ON d.owner_id = u.user_id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching dogs:', error);
    res.status(500).json({ error: '获取狗狗列表失败' });
  }
});

// 路由2：获取所有状态为open的遛狗请求
app.get('/api/walkrequests/open', async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        r.request_id, 
        d.name AS dog_name, 
        r.requested_time, 
        r.duration_minutes, 
        r.location, 
        u.username AS owner_username
      FROM WalkRequests r
      JOIN Dogs d ON r.dog_id = d.dog_id
      JOIN Users u ON d.owner_id = u.user_id
      WHERE r.status = 'open'
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching open walk requests:', error);
    res.status(500).json({ error: '获取开放遛狗请求失败' });
  }
});

// 路由3：获取每个遛狗者的摘要，包括平均评分和已完成的遛狗数量
app.get('/api/walkers/summary', async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT 
        u.username AS walker_username,
        COUNT(r.rating_id) AS total_ratings,
        AVG(r.rating) AS average_rating,
        (
          SELECT COUNT(*) 
          FROM WalkApplications wa
          JOIN WalkRequests wr ON wa.request_id = wr.request_id
          WHERE wa.walker_id = u.user_id 
          AND wr.status = 'completed'
          AND wa.status = 'accepted'
        ) AS completed_walks
      FROM Users u
      LEFT JOIN WalkRatings r ON u.user_id = r.walker_id
      WHERE u.role = 'walker'
      GROUP BY u.user_id
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching walker summary:', error);
    res.status(500).json({ error: '获取遛狗者摘要失败' });
  }
});

// 启动服务器
async function startServer() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer(); 