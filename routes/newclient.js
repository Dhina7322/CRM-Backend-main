const express = require("express");
const router = express.Router();
const db = require("../config/database");

/* SEARCH CLIENT */
router.get("/search", (req, res) => {
  const search = `%${req.query.name || ""}%`;

  db.query(
    "SELECT company_name FROM clients WHERE company_name LIKE ?",
    [search],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Search failed" });
      res.json(results);
    }
  );
});

/* CREATE CLIENT */
router.post("/new", (req, res) => {
  const {
    company_name,
    client_firstname,
    client_lastname,
    client_email,
  } = req.body;

  if (!company_name || !client_firstname || !client_lastname || !client_email) {
    return res.status(400).json({ message: "All  required" });
  }

  const sql = `
    INSERT INTO clients
    (company_name, client_firstname, client_lastname, client_email)
    VALUES (?,?,?,?)
  `;

  db.query(
    sql,
    [company_name, client_firstname, client_lastname, client_email],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(409).json({ message: "Client already exists" });
        }
        return res.status(500).json({ message: "Insert failed" });
      }

      res.json({ success: true, client_id: result.insertId });
    }
  );
});

module.exports = router;
