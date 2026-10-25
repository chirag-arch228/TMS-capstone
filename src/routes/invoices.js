const express = require("express");
const router = express.Router();

// GET all invoices
router.get("/", (req, res) => {
  res.json([
    {
      id: 1,
      invoice_number: "INV001",
      amount: 25000,
      status: "Pending"
    }
  ]);
});

// GET invoice by ID
router.get("/:id", (req, res) => {
  res.json({
    id: req.params.id,
    invoice_number: "INV001",
    amount: 25000,
    status: "Pending"
  });
});

// CREATE invoice
router.post("/", async (req, res) => {
    try {
      const { trip_id, amount, invoice_date, status } = req.body;
  
      const tripResult = await pool.query(
        "SELECT * FROM trips WHERE id = $1",
        [trip_id]
      );
  
      if (tripResult.rows.length === 0) {
        return res.status(404).json({
          error: "Trip not found"
        });
      }
  
      const invoiceCheck = await pool.query(
        "SELECT * FROM invoices WHERE trip_id = $1",
        [trip_id]
      );
  
      if (invoiceCheck.rows.length > 0) {
        return res.status(400).json({
          error: "Invoice already exists for this trip"
        });
      }
  
      const result = await pool.query(
        `INSERT INTO invoices
        (trip_id, amount, invoice_date, status)
        VALUES ($1, $2, $3, $4)
        RETURNING *`,
        [trip_id, amount, invoice_date, status]
      );
  
      res.status(201).json(result.rows[0]);
  
    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        error: "Server Error"
      });
    }
  });
  
// UPDATE invoice
router.put("/:id", (req, res) => {
  res.json({
    message: "Invoice updated",
    id: req.params.id,
    data: req.body
  });
});

// DELETE invoice
router.delete("/:id", (req, res) => {
  res.json({
    message: "Invoice deleted",
    id: req.params.id
  });
});

module.exports = router;