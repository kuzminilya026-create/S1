import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Отключаем строгую проверку SSL сертификатов для облачных БД
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const { Pool } = pg;

// Настройка подключения к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Увеличенные настройки для облачной БД
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  acquireTimeoutMillis: 10000,
  // SSL настройки для облачной БД (исправлено)
  ssl: {
    rejectUnauthorized: false  // Отключаем проверку самоподписанных сертификатов
  },
  // Дополнительные настройки для стабильности
  query_timeout: 10000,
  statement_timeout: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Тестирование подключения
pool.on('connect', () => {
  console.log('✅ Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
  console.error('❌ Ошибка подключения к PostgreSQL:', err);
});

// Функция для выполнения запросов с улучшенной обработкой ошибок
export const query = async (text, params) => {
  const start = Date.now();
  let client;
  try {
    client = await pool.connect();
    const res = await client.query(text, params);
    const duration = Date.now() - start;
    console.log('✅ Выполнен запрос:', { 
      text: text.substring(0, 50) + '...', 
      duration: duration + 'ms', 
      rows: res.rowCount 
    });
    return res;
  } catch (error) {
    const duration = Date.now() - start;
    console.error('❌ Ошибка выполнения запроса:', { 
      text: text.substring(0, 50) + '...', 
      duration: duration + 'ms',
      error: error.message 
    });
    throw error;
  } finally {
    if (client) client.release();
  }
};

// Функция для получения клиента из пула
export const getClient = async () => {
  return await pool.connect();
};

export default pool;
