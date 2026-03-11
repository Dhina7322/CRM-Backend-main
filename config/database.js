const mysql = require("mysql2");
require("dotenv").config();

// Railway often provides a single URL or separate components. 
// For external access (like Render to Railway), we often need the Public URL.
const dbUrl = process.env.MYSQL_PUBLIC_URL || process.env.MYSQL_URL;

let pool;

if (dbUrl) {
  console.log("🔗 Using MySQL URL for connection");
  pool = mysql.createPool(dbUrl + "?ssl={\"rejectUnauthorized\":false}");
} else {
  console.log("🧩 Using MySQL components for connection");
  pool = mysql.createPool({
    host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
    user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
    password: process.env.DB_PASS || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE,
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
      rejectUnauthorized: false
    }
  });
}

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ MySQL Connection Failed:", err.message);
    console.error("DEBUG INFO:", {
      host: process.env.MYSQLHOST,
      port: process.env.MYSQLPORT,
      user: process.env.MYSQLUSER,
      database: process.env.MYSQLDATABASE,
      hasPassword: !!process.env.MYSQLPASSWORD
    });
  } else {
    console.log("✅ MySQL Connected Successfully (Pool)");
    connection.release();
  }
});

module.exports = pool;
