const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  
  password: process.env.DB_PASSWORD || "muskaan2105@",
  database: process.env.DB_NAME || "flight_booking",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});


(async () => {
  try {
    const conn = await pool.getConnection();
    conn.release();
    console.log("Database pool created and connection tested");
  } catch (err) {
    console.error("Unable to connect to the database:", err.message);
  }
})();

module.exports = pool;