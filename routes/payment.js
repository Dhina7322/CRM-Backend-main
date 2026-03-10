const express = require("express");
const router = express.Router();
const db = require ("../config/database")

// CREATE PAYMENT
router.post("/new", (req, res) => {
  const {
    invoice_id,
    amount,
    payment_date,
    payment_method,
    Transaction_ID,
    invoice_email,
  } = req.body;

  db.query(
    `INSERT INTO payments
     (invoice_id, amount, payment_date, payment_method, Transaction_ID, invoice_email)
     VALUES (?,?,?,?,?,?)`,
    [
      Number(invoice_id),
      Number(amount),
      payment_date,
      payment_method,
      Transaction_ID || null,
      invoice_email ? 1 : 0,
    ],
    (err, result) => {
      if (err) {
        console.error("MYSQL ERROR:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Payment added", id: result.insertId });
    }
  );
});

// GET PAYMENTS
router.get("/", (req, res) => {
  const sql = `
    SELECT 
      id,
      invoice_id,
      DATE(payment_date) AS payment_date,
      amount,
      payment_method,
      Transaction_ID,
      invoice_email
    FROM payments
    ORDER BY id DESC
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// UPDATE
router.put("/:id", (req, res) => {
  const id = req.params.id;
  const {
    invoice_id,
    amount,
    payment_date,
    payment_method,
    Transaction_ID,
    invoice_email,
  } = req.body;

  db.query(
    `UPDATE payments SET
      invoice_id=?,
      amount=?,
      payment_date=?,
      payment_method=?,
      Transaction_ID=?,
      invoice_email=?
     WHERE id=?`,
    [
      invoice_id,
      amount,
      payment_date,
      payment_method,
      Transaction_ID,
      invoice_email,
      id,
    ],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Payment updated" });
    }
  );
});

// DELETE

router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM payments WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Payment deleted" });
    }
  );
});



module.exports = router;
