const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { generateOtp } = require("../backendutil/otp");
const sendEmailOtp = require("../backendutil/sendSms");

const router = express.Router();

/* ================= SEND EMAIL OTP ================= */
router.post("/send-email-otp", async (req, res) => {
  const { email } = req.body;

  // 1. Validate email input
  if (!email) {
    return res.status(400).json({ success: false, message: "Email is required" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: "Invalid email format" });
  }

  try {
    const otp = generateOtp();
    const expires = new Date(Date.now() + 5 * 60000); // 5 minutes

    console.log(`[AUTH] Requesting OTP for: ${email}`);

    // 2. Ensure the table exists or just query directly. 
    // Usually, you should run migrations, but for simplicity here we'll handle the query.
    // Use .promise() to handle multiple async operations cleanly.
    try {
      await db.promise().query(
        `INSERT INTO email_otp (email, otp, expires_at)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE otp=?, expires_at=?`,
        [email, otp, expires, otp, expires]
      );
    } catch (dbErr) {
      console.error("[DATABASE ERROR]:", dbErr.message);

      // If table is missing, tell the user or create it.
      if (dbErr.code === 'ER_NO_SUCH_TABLE') {
        console.log("[DATABASE] Creating 'email_otp' table...");
        await db.promise().query(`
          CREATE TABLE IF NOT EXISTS email_otp (
            email VARCHAR(255) PRIMARY KEY,
            otp VARCHAR(6) NOT NULL,
            expires_at DATETIME NOT NULL
          )
        `);
        // Retry the insert
        await db.promise().query(
          `INSERT INTO email_otp (email, otp, expires_at)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE otp=?, expires_at=?`,
          [email, otp, expires, otp, expires]
        );
      } else {
        throw dbErr;
      }
    }

    // 3. Send email using nodemailer
    await sendEmailOtp(email, otp);
    console.log(`[AUTH] OTP sent successfully to: ${email}`);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully to your email."
    });

  } catch (error) {
    console.error("[AUTH ERROR]:", error);

    // Check for common error types
    const statusCode = error.name === 'EmailError' ? 503 : 500;
    return res.status(statusCode).json({
      success: false,
      message: "Failed to send OTP. Please try again later.",
      details: error.message, // This will show the exact error in your browser console
      error_name: error.name
    });
  }
});

/*  REGISTER  */
router.post("/register", async (req, res) => {
  const { first_name, email, otp, user_password, role } = req.body;

  if (!first_name || !email || !otp || !user_password) {
    return res.status(400).json({ message: "All fields required" });
  }

  db.query(
    `SELECT * FROM email_otp
     WHERE email=? AND otp=? AND expires_at > NOW()`,
    [email, otp],
    async (err, rows) => {
      if (!rows.length) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
      }

      const hash = await bcrypt.hash(user_password, 10);

      db.query(
        `INSERT INTO users (first_name, email, user_password, role)
         VALUES (?,?,?,?)`,
        [first_name, email, hash, role || "user"],
        (err) => {
          if (err) {
            if (err.code === "ER_DUP_ENTRY") {
              return res
                .status(409)
                .json({ message: "Email already registered" });
            }
            return res.status(500).json({ message: "Server error" });
          }

          // delete OTP after success
          db.query(`DELETE FROM email_otp WHERE email=?`, [email]);

          res.json({ message: "Registered successfully" });
        }
      );
    }
  );
});

/*  LOGIN (EMAIL + OTP) */
router.post("/login", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP required" });
  }

  db.query(
    `SELECT u.id, u.first_name, u.email, u.role
     FROM users u
     JOIN email_otp o ON u.email = o.email
     WHERE u.email=? AND o.otp=? AND o.expires_at > NOW()`,
    [email, otp],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Server error" });

      if (!rows.length) {
        return res.status(401).json({ message: "Invalid or expired OTP" });
      }

      const user = rows[0];

      const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
      );

      // delete OTP after successful login
      db.query(`DELETE FROM email_otp WHERE email=?`, [email]);

      res.json({
        token,
        user: {
          id: user.id,
          name: user.first_name,
          email: user.email,
          role: user.role,
        },
      });
    }
  );
});

/* ================= GET ALL USERS ================= */

router.get("/users", (req, res) => {
  const query = `
    SELECT 
      u.id,
      u.first_name,
      t.job_title AS position,
      t.emp_role AS empRole,
      u.role AS systemRole
    FROM users u
    LEFT JOIN teammember t 
      ON u.email = t.emp_email
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching users:", err);
      return res.status(500).json({ message: "Database error" });
    }
    res.json(results);
  });
});

module.exports = router;
