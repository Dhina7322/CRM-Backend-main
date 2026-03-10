const express = require("express");
const router = express.Router();
const db = require("../config/database");


// CREATE INVOICE
router.post("/new", (req, res) => {
  const {
    client_company,
    project_names,
    invoice_date,
    invoice_duedate,
    category,
  } = req.body;

  db.query(
    `INSERT INTO clientinvoices 
     (client_company, project_names, invoice_date, invoice_duedate, category)
     VALUES (?,?,?,?,?)`,
    [
      client_company,
      project_names,
      invoice_date,
      invoice_duedate,
      category,
    ],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Invoice insert failed" });
      }
      res.json({ message: "Invoice created", id: result.insertId });
    }
  );
});

//  JOIN QUERY
router.get("/with-payments", (req, res) => {
  const sql = `
    SELECT 
  i.id,
  i.client_company,
  i.invoice_date,
  i.project_names,
  IFNULL(SUM(p.amount), 0) AS paid_amount
FROM clientinvoices i
LEFT JOIN payments p ON p.invoice_id = i.id
GROUP BY i.id
ORDER BY i.id DESC

  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Fetch failed" });
    }
    res.json(results);
  });
});

module.exports = router;
