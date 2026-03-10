const express = require("express");
const router = express.Router();
const db = require("../config/database");


// GET ALL QUOTATIONS (FOR TABLE)
router.get("/", (req, res) => {
  const sql = `
    SELECT
      q.id,
      q.quotation_date,
      q.grand_total,
      c.customer_name,
      c.mobile_number,
      c.location_city,
      MIN(qi.description) AS description
    FROM quotations q
    JOIN customers c ON c.id = q.customer_id
    LEFT JOIN quotation_items qi ON qi.quotation_id = q.id
    GROUP BY q.id
    ORDER BY q.id ASC
  `;

  db.query(sql, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }
    res.json(rows);
  });
});



/* GET INVOICE */
router.get("/:id", (req, res) => {
  const id = req.params.id;

  const sql = `
    SELECT 
      q.id AS quotation_id,
      q.quotation_date,
      q.subtotal,
      q.total_tax,
       q.total_cgst,        
      q.total_sgst, 
      q.total_discount,
      q.grand_total,
      c.customer_name,
      c.mobile_number,
      c.email,
      c.location_city,
      qi.product_number,
      qi.description,
      qi.price,
      qi.quantity,
      qi.subtotal AS item_subtotal
    FROM quotations q
    JOIN customers c ON c.id = q.customer_id
    JOIN quotation_items qi ON qi.quotation_id = q.id
    WHERE q.id = ?
  `;

  db.query(sql, [id], (err, rows) => {
    if (err) return res.status(500).json(err);
    if (!rows.length) return res.status(404).json([]);
    res.json(rows);
  });
});

/* ================= CREATE QUOTATION ================= */

const validateQuotation = ({ customer, quotation, items }) => {
  if (!customer.customer_name)
    return "Customer name is required";

  if (!customer.mobile_number)
    return "Mobile number is required";

  if (!quotation.quotation_date)
    return "Quotation date is required";

  if (!items || items.length === 0)
    return "At least one item is required";

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    if (!item.description)
      return `Item ${i + 1}: Description is required`;

    if (item.price === "" || item.price === null)
      return `Item ${i + 1}: Price is required`;

    if (!item.quantity || item.quantity <= 0)
      return `Item ${i + 1}: Quantity must be greater than 0`;
  }

  return null;
};


router.post("/create", (req, res) => {

  const error = validateQuotation(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }

  const { customer, quotation, items } = req.body;

     const quotationDate =
    quotation.quotation_date &&
    quotation.quotation_date !== "0000-00-00"
      ? quotation.quotation_date
      : new Date().toISOString().slice(0, 10);

  db.beginTransaction(err => {
  if (err) return res.status(500).json({ message: "Transaction error" });


    db.query(
      `INSERT INTO customers (customer_name, mobile_number, email, location_city)
       VALUES (?,?,?,?)`,
      [
        customer.customer_name,
        customer.mobile_number,
        customer.email,
        customer.location_city,
      ],
      (err, customerResult) => {
        if (err) return db.rollback(() => res.status(500).json(err));

        const customerId = customerResult.insertId;

        

        db.query(
          `INSERT INTO quotations
           (customer_id, quotation_date,  total_cgst, total_sgst, subtotal, total_tax, total_discount, grand_total)
           VALUES (?,?,?,?,?,?,?,?)`,
          [
            customerId,
             quotation.quotation_date,
            quotation.subtotal,
            quotation.total_cgst,
             quotation.total_sgst,
            quotation.total_cgst + quotation.total_sgst,
            quotation.total_discount,
            quotation.grand_total,
          ],
          (err, quotationResult) => {
            if (err) return db.rollback(() => res.status(500).json(err));

            const quotationId = quotationResult.insertId;

            const values = items.map((item, index) => [
              quotationId,
              index + 1,
              item.description,
              item.price,
              item.quantity,
              item.tax,
              item.discount,
              item.subtotal,
            ]);

            db.query(
              `INSERT INTO quotation_items
               (quotation_id, product_number, description, price, quantity, tax, discount, subtotal)
               VALUES ?`,
              [values],
              err => {
                if (err) return db.rollback(() => res.status(500).json(err));

                db.commit(err => {
                  if (err) return db.rollback(() => res.status(500).json(err));

                  res.status(201).json({
                    message: "Quotation Created Successfully",
                    quotationId,
                  });
                });
              }
            );
          }
        );
      }
    );
  });
});

// Update

router.put("/:id", (req, res) => {

   const error = validateQuotation(req.body);
  if (error) {
    return res.status(400).json({ message: error });
  }
  
  const { id } = req.params;
  const { customer, quotation, items } = req.body;

  db.beginTransaction(err => {
    if (err) return res.status(500).json(err);

    // 1️⃣ Update customer
    db.query(
      `UPDATE customers
       SET customer_name=?, mobile_number=?, email=?, location_city=?
       WHERE id = (SELECT customer_id FROM quotations WHERE id=?)`,
      [
        customer.customer_name,
        customer.mobile_number,
        customer.email,
        customer.location_city,
        id,
      ],
      err => {
        if (err) return db.rollback(() => res.status(500).json(err));

        // 2️⃣ Update quotation (correct column names)
        db.query(
          `UPDATE quotations
           SET quotation_date=?, subtotal=?,total_cgst=?,total_sgst=?, total_tax=?, total_discount=?, grand_total=?
           WHERE id=?`,
          [
            quotation.quotation_date,
            quotation.subtotal,
            quotation.total_cgst,
            quotation.total_sgst,
            quotation.total_cgst + quotation.total_sgst,
            quotation.total_discount,
            quotation.grand_total,
            id,
          ],
          err => {
            if (err) return db.rollback(() => res.status(500).json(err));

            // 3️⃣ Delete old items
            db.query(
              `DELETE FROM quotation_items WHERE quotation_id=?`,
              [id],
              err => {
                if (err) return db.rollback(() => res.status(500).json(err));

                // 4️⃣ Insert new items
                const values = items.map((item, index) => [
                  id,
                  index + 1,
                  item.description,
                  item.price,
                  item.quantity,
                  item.tax,
                  item.discount,
                  item.subtotal,
                ]);

                db.query(
                  `INSERT INTO quotation_items
                   (quotation_id, product_number, description, price, quantity, tax, discount, subtotal)
                   VALUES ?`,
                  [values],
                  err => {
                    if (err)
                      return db.rollback(() => res.status(500).json(err));

                    db.commit(err => {
                      if (err)
                        return db.rollback(() =>
                          res.status(500).json(err)
                        );

                      res.json({ message: "Quotation updated successfully" });
                    });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});



/// DELETE QUOTATION (SAFE)
router.delete("/:id", (req, res) => {
  const { id } = req.params;

  db.beginTransaction(err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Transaction failed" });
    }

    // delete items first
    db.query(
      "DELETE FROM quotation_items WHERE quotation_id = ?",
      [id],
      err => {
        if (err) {
          console.error(err);
          return db.rollback(() =>
            res.status(500).json({ error: "Item delete failed" })
          );
        }

        // delete quotation
        db.query(
          "DELETE FROM quotations WHERE id = ?",
          [id],
          err => {
            if (err) {
              console.error(err);
              return db.rollback(() =>
                res.status(500).json({ error: "Quotation delete failed" })
              );
            }

            db.commit(err => {
              if (err) {
                console.error(err);
                return db.rollback(() =>
                  res.status(500).json({ error: "Commit failed" })
                );
              }

              res.json({ message: "Quotation deleted successfully" });
            });
          }
        );
      }
    );
  });
});



module.exports = router;
