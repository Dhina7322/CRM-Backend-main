const express = require("express");
const router = express.Router();
const db = require("../config/database");

/* CREATE FIELD */

router.post("/new", (req, res) => {
  const data = req.body;

  if (!data.customer_name || !data.visit_date) {
    return res.status(400).json({ message: "Customer name & visit date required" });
  }

  db.query("INSERT INTO fields SET ?", data, (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Insert failed" });
    }
    res.json({ message: "Field added", id: result.insertId });
  });
});

/* 
   FETCH ALL FIELDS */
router.get("/", (req, res) => {
  db.query("SELECT * FROM fields ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ message: "Fetch failed" });
    res.json(results);
  });
});

/* 
   FETCH SINGLE FIELD (EDIT) */
router.get("/:id", (req, res) => {
  db.query(
    "SELECT * FROM fields WHERE id = ?",
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Fetch failed" });
      res.json(results[0]);
    }
  );
});

/*  UPDATE FIELD */
router.put("/:id", (req, res) => {
  const {
    customer_name,
    mobile_number,
    location_city,
    visit_date,
    purpose,
    staff_name,
    field_outcome,
    followup_required,
    followup_date,
    followup_notes,
    reminder_required,
    reminder_date,
    reminder_notes,
  } = req.body;

  db.query(
    `UPDATE fields SET
      customer_name=?,
      mobile_number=?,
      location_city=?,
      visit_date=?,
      purpose=?,
      staff_name=?,
      field_outcome=?,
      followup_required=?,
      followup_date=?,
      followup_notes=?,
      reminder_required=?,
      reminder_date=?,
      reminder_notes=?
     WHERE id=?`,
    [
      customer_name,
      mobile_number,
      location_city,
      visit_date,
      purpose,
      staff_name,
      field_outcome,
      followup_required,
      followup_date,
      followup_notes,
      reminder_required,
      reminder_date,
      reminder_notes,
      req.params.id,
    ],
    (err, result) => {
      if (err) {
        console.error("UPDATE ERROR:", err.sqlMessage);
        return res.status(500).json({ message: err.sqlMessage });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Field not found" });
      }

      res.json({ message: "Field updated successfully" });
    }
  );
});


/*  DELETE FIELD */
router.delete("/:id", (req, res) => {
  db.query(
    "DELETE FROM fields WHERE id = ?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Delete failed" });
      res.json({ message: "Field deleted" });
    }
  );
});

module.exports = router;
