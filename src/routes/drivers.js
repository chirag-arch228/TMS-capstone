const express = require("express");
const router = express.Router();
const pool = require("../db/postgres");

// GET all drivers
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM drivers ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get drivers error:", error.message);
    res.status(500).json({ message: "Failed to retrieve drivers" });
  }
});

// GET driver by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM drivers WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get driver error:", error.message);
    res.status(500).json({ message: "Failed to retrieve driver" });
  }
});

// POST create driver
router.post("/", async (req, res) => {
  try {
    const { name, phone, licenseNumber, status = "available" } = req.body;

    if (!name?.trim() || !/^\d{10}$/.test(phone || "") ||
        !licenseNumber?.trim()) {
      return res.status(400).json({
        message: "Name, a 10-digit phone number, and license number are required"
      });
    }

    const allowedStatuses = ["available", "on_trip", "unavailable"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid driver status" });
    }

    const result = await pool.query(
      `INSERT INTO drivers (name, phone, license_number, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), phone, licenseNumber.trim(), status]
    );

    res.status(201).json({
      message: "Driver created successfully",
      driver: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Phone number or license number already exists"
      });
    }

    console.error("Create driver error:", error.message);
    res.status(500).json({ message: "Failed to create driver" });
  }
});

// PUT update driver
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid driver ID" });
    }

    const { name, phone, licenseNumber, status } = req.body;
    const allowedStatuses = ["available", "on_trip", "unavailable"];

    if (name !== undefined &&
        (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({ message: "Name cannot be empty" });
    }

    if (phone !== undefined && !/^\d{10}$/.test(phone)) {
      return res.status(400).json({ message: "Phone must contain 10 digits" });
    }

    if (licenseNumber !== undefined &&
        (typeof licenseNumber !== "string" || !licenseNumber.trim())) {
      return res.status(400).json({ message: "License number cannot be empty" });
    }

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid driver status" });
    }

    const result = await pool.query(
      `UPDATE drivers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           license_number = COALESCE($3, license_number),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [
        name === undefined ? null : name.trim(),
        phone === undefined ? null : phone,
        licenseNumber === undefined ? null : licenseNumber.trim(),
        status === undefined ? null : status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({
      message: "Driver updated successfully",
      driver: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "Phone number or license number already exists"
      });
    }

    console.error("Update driver error:", error.message);
    res.status(500).json({ message: "Failed to update driver" });
  }
});

// DELETE driver
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM drivers WHERE id = $1 RETURNING id",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Driver not found" });
    }

    res.json({ message: "Driver deleted successfully" });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        message: "Cannot delete this driver because trips reference them"
      });
    }

    console.error("Delete driver error:", error.message);
    res.status(500).json({ message: "Failed to delete driver" });
  }
});

module.exports = router;

