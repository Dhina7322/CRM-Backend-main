const express = require("express");
const router = express.Router();
const db = require("../config/database");

// GET all telecalls
router.get("/", (req, res) => {
  db.query("SELECT * FROM Telecalls ORDER BY id DESC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// GET single telecall (EDIT)
router.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid ID" });
  }

  db.query(
    "SELECT * FROM Telecalls WHERE id = ?",
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results[0]);
    }
  );
});


// POST telecall
router.post("/", (req, res) => {
  const {
    customer_name,
    mobile_number,
    location_city,
    call_date,
    service_name,
    staff_name,
    call_outcome,
    followup_required,
    followup_date,
    followup_notes,
    reminder_required,
    reminder_date,
    reminder_notes
  } = req.body;

  const sql = `
    INSERT INTO Telecalls (
      customer_name,
      mobile_number,
      location_city,
      call_date,
      service_name,
      staff_name,
      call_outcome,
      followup_required,
      followup_date,
      followup_notes,
      reminder_required,
      reminder_date,
      reminder_notes
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      customer_name,
      mobile_number,
      location_city,
      call_date,
      service_name,
      staff_name,
      call_outcome,
      followup_required,
      followup_date,
      followup_notes,
      reminder_required,
      reminder_date,
      reminder_notes
    ],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Telecall added", id: result.insertId });
    }
  );
});


// Edit 

router.put("/:id", (req, res) => {
  const {
    customer_name,
    mobile_number,
    location_city,
    call_date,
    service_name,
    staff_name,
    call_outcome,
    followup_required,
    followup_date,
    followup_notes,
    reminder_required,
    reminder_date,
    reminder_notes
  } = req.body;

  db.query(
    `UPDATE Telecalls SET
      customer_name=?,
      mobile_number=?,
      location_city=?,
      call_date=?,
      service_name=?,
      staff_name=?,
      call_outcome=?,
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
      call_date,
      service_name,
      staff_name,
      call_outcome,
      followup_required,
      followup_date,
      followup_notes,
      reminder_required,
      reminder_date,
      reminder_notes,
      req.params.id
    ],
    (err, result) => {
      if (err) {
        console.error("Update error:", err);
        return res.status(500).json({ error: err.message });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Telecall not found" });
      }

      res.json({ message: "Telecall updated successfully" });
    }
  );
});



  // Delete;
  router.delete("/:id",(req,res) =>{
    db.query(
      "DELETE FROM Telecalls WHERE id = ?",
      [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: "Delete failed" });
      res.json({ message: "Field deleted" });
    }
    );
  })

module.exports = router;
