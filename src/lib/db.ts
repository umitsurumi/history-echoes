import { Pool } from 'pg';

// 创建数据库连接池
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'echoes',
    user: 'admin',
    password: 'admin',
    max: 20, // 最大连接数
    idleTimeoutMillis: 30000, // 连接空闲超时时间
    connectionTimeoutMillis: 2000, // 连接超时时间
});

// 数据库查询函数
export async function query(text: string, params?: any[]) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

// 测试数据库连接
export async function testConnection() {
    try {
        const result = await query('SELECT NOW()');
        console.log('Database connected successfully:', result.rows[0]);
        return true;
    } catch (error) {
        console.error('Database connection failed:', error);
        return false;
    }
}

export default pool;