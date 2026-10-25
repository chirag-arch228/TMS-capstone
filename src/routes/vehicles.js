const express = require("express");
const router = express.Router();
const pool = require("../db/postgres");

// GET all vehicles
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM vehicles ORDER BY id"
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get vehicles error:", error.message);
    res.status(500).json({
      message: "Failed to retrieve vehicles"
    });
  }
});

// GET vehicle by ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid vehicle ID"
      });
    }

    const result = await pool.query(
      "SELECT * FROM vehicles WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Get vehicle error:", error.message);
    res.status(500).json({
      message: "Failed to retrieve vehicle"
    });
  }
});

// POST create vehicle
router.post("/", async (req, res) => {
  try {
    const {
      plate,
      vehicleType,
      capacityKg,
      status = "available"
    } = req.body;

    if (typeof plate !== "string" || !plate.trim()) {
      return res.status(400).json({
        message: "Vehicle plate is required"
      });
    }

    if (
      vehicleType !== undefined &&
      (typeof vehicleType !== "string" || !vehicleType.trim())
    ) {
      return res.status(400).json({
        message: "Vehicle type must be a non-empty string"
      });
    }

    if (
      capacityKg !== undefined &&
      capacityKg !== null &&
      (!Number.isFinite(Number(capacityKg)) || Number(capacityKg) <= 0)
    ) {
      return res.status(400).json({
        message: "Capacity must be a positive number"
      });
    }

    const allowedStatuses = [
      "available",
      "on_trip",
      "maintenance",
      "unavailable"
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid vehicle status"
      });
    }

    const result = await pool.query(
      `INSERT INTO vehicles
         (plate, vehicle_type, capacity_kg, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        plate.trim().toUpperCase(),
        vehicleType?.trim() || null,
        capacityKg === undefined || capacityKg === null
          ? null
          : Number(capacityKg),
        status
      ]
    );

    res.status(201).json({
      message: "Vehicle created successfully",
      vehicle: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This vehicle plate already exists"
      });
    }

    console.error("Create vehicle error:", error.message);
    res.status(500).json({
      message: "Failed to create vehicle"
    });
  }
});

// PUT update vehicle
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid vehicle ID"
      });
    }

    const { plate, vehicleType, capacityKg, status } = req.body;

    if (
      plate !== undefined &&
      (typeof plate !== "string" || !plate.trim())
    ) {
      return res.status(400).json({
        message: "Plate cannot be empty"
      });
    }

    if (
      vehicleType !== undefined &&
      vehicleType !== null &&
      (typeof vehicleType !== "string" || !vehicleType.trim())
    ) {
      return res.status(400).json({
        message: "Vehicle type must be a non-empty string"
      });
    }

    if (
      capacityKg !== undefined &&
      capacityKg !== null &&
      (!Number.isFinite(Number(capacityKg)) || Number(capacityKg) <= 0)
    ) {
      return res.status(400).json({
        message: "Capacity must be a positive number"
      });
    }

    const allowedStatuses = [
      "available",
      "on_trip",
      "maintenance",
      "unavailable"
    ];

    if (status !== undefined && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid vehicle status"
      });
    }

    const result = await pool.query(
      `UPDATE vehicles
       SET plate = COALESCE($1, plate),
           vehicle_type = COALESCE($2, vehicle_type),
           capacity_kg = COALESCE($3, capacity_kg),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [
        plate === undefined ? null : plate.trim().toUpperCase(),
        vehicleType === undefined ? null : vehicleType?.trim() || null,
        capacityKg === undefined ? null :
          capacityKg === null ? null : Number(capacityKg),
        status === undefined ? null : status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    res.json({
      message: "Vehicle updated successfully",
      vehicle: result.rows[0]
    });
  } catch (error) {
    if (error.code === "23505") {
      return res.status(409).json({
        message: "This vehicle plate already exists"
      });
    }

    console.error("Update vehicle error:", error.message);
    res.status(500).json({
      message: "Failed to update vehicle"
    });
  }
});

// DELETE vehicle
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: "Invalid vehicle ID"
      });
    }

    const result = await pool.query(
      "DELETE FROM vehicles WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Vehicle not found"
      });
    }

    res.json({
      message: "Vehicle deleted successfully"
    });
  } catch (error) {
    if (error.code === "23503") {
      return res.status(409).json({
        message: "Cannot delete this vehicle because trips reference it"
      });
    }

    console.error("Delete vehicle error:", error.message);
    res.status(500).json({
      message: "Failed to delete vehicle"
    });
  }
});

module.exports = router;