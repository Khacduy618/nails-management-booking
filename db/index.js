// import { drizzle } from 'drizzle-orm/mysql2';
// import mysql from 'mysql2/promise';
// import * as schema from './schema.js';

// const pool = mysql.createPool({
//   host: process.env.DATABASE_HOST,
//   port: parseInt(process.env.DATABASE_PORT || '3306'),
//   user: process.env.DATABASE_USER,
//   password: process.env.DATABASE_PASSWORD,
//   database: process.env.DATABASE_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// export const db = drizzle(pool, { schema, mode: 'default' });
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

// Xây dựng chuỗi kết nối từ biến môi trường
const connectionString = `mysql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

// Tạo một kết nối duy nhất thay vì pool
const connection = mysql.createPool({
  uri: connectionString,
  waitForConnections: true,
  connectionLimit: 10, // Giữ nguyên giới hạn này
  queueLimit: 0,
  timezone: '+07:00', // Timezone cho Việt Nam (HCM)
});

// Truyền pool vào Drizzle
export const db = drizzle(connection, { schema, mode: 'default' });
