import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

export default {
  schema: './db/*.js',
  out: './drizzle',
  dialect: 'mysql', // <<-- SỬA Ở ĐÂY: Đổi 'driver' thành 'dialect'
                      // <<-- SỬA Ở ĐÂY: Đổi giá trị từ "mysql2" thành "mysql"
  dbCredentials: {
    host: process.env.DATABASE_HOST!,
    port: parseInt(process.env.DATABASE_PORT!),
    user: process.env.DATABASE_USER!,
    password: process.env.DATABASE_PASSWORD!,
    database: process.env.DATABASE_NAME!,
  },
  // Thêm dòng này để drizzle-kit biết cần tìm file schema ở đâu khi chạy
  // các lệnh khác ngoài generate.
  verbose: true,
  strict: true,
} satisfies Config;