const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/database");
const { generateOtp } = require("../backendutil/otp");
const sendEmailOtp = require("../backendutil/sendSms");

const router = express.Router();

/* ================= SEND EMAIL OTP ================= */
router.post("/send-email-otp", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email required" });
  }

  const otp = generateOtp();
  const expires = new Date(Date.now() + 5 * 60000);

  db.query(
    `INSERT INTO email_otp (email, otp, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE otp=?, expires_at=?`,
    [email, otp, expires, otp, expires],
    async (err) => {
      if (err) {
        console.error("DB ERROR:", err);
        return res.status(500).json({ message: "OTP database error" });
      }

      try {
        await sendEmailOtp(email, otp);
        res.json({ message: "OTP sent to email" });
      } catch (error) {
        console.error("EMAIL ERROR:", error);
        res.status(500).json({ message: "Email sending failed" });
      }
    }
  );
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
