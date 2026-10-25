const express = require("express");
const router = express.Router();
const pool = require("../db/postgres");

const allowedStatuses = ["scheduled", "in_progress", "completed", "cancelled"];

router.get("/", async (req, res) => {
try {
const result = await pool.query(
"SELECT t.*, d.name AS driver_name, v.plate AS vehicle_plate " +
"FROM public.trips t " +
"JOIN public.drivers d ON t.driver_id = d.id " +
"JOIN public.vehicles v ON t.vehicle_id = v.id " +
"ORDER BY t.id"
);


res.status(200).json({
  success: true,
  count: result.rows.length,
  data: result.rows
});


} catch (error) {
console.error("Get trips error:", error.message);
res.status(500).json({ success: false, message: "Failed to retrieve trips." });
}
});

router.get("/:id", async (req, res) => {
try {
const id = Number(req.params.id);


if (!Number.isInteger(id) || id <= 0) {
  return res.status(400).json({ success: false, message: "Invalid trip ID." });
}

const result = await pool.query(
  "SELECT t.*, d.name AS driver_name, v.plate AS vehicle_plate " +
  "FROM public.trips t " +
  "JOIN public.drivers d ON t.driver_id = d.id " +
  "JOIN public.vehicles v ON t.vehicle_id = v.id " +
  "WHERE t.id = $1",
  [id]
);

if (result.rows.length === 0) {
  return res.status(404).json({ success: false, message: "Trip not found." });
}

res.status(200).json({ success: true, data: result.rows[0] });


} catch (error) {
console.error("Get trip error:", error.message);
res.status(500).json({ success: false, message: "Failed to retrieve trip." });
}
});

router.post("/", async (req, res) => {
let client;
let transactionStarted = false;

try {
const { driverId, vehicleId, origin, destination, status = "scheduled" } = req.body;


if (!Number.isInteger(driverId) || driverId <= 0) {
  return res.status(400).json({ success: false, message: "driverId must be a positive integer." });
}

if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
  return res.status(400).json({ success: false, message: "vehicleId must be a positive integer." });
}

if (typeof origin !== "string" || !origin.trim()) {
  return res.status(400).json({ success: false, message: "Origin is required." });
}

if (typeof destination !== "string" || !destination.trim()) {
  return res.status(400).json({ success: false, message: "Destination is required." });
}

if (typeof status !== "string" || !allowedStatuses.includes(status)) {
  return res.status(400).json({
    success: false,
    message: "Status must be one of: " + allowedStatuses.join(", ") + "."
  });
}

if (status === "completed" || status === "cancelled") {
  return res.status(400).json({
    success: false,
    message: "Create a trip as scheduled or in_progress. Complete or cancel it using PUT."
  });
}

client = await pool.connect();
await client.query("BEGIN");
transactionStarted = true;

const availability = await client.query(
  "SELECT d.status AS driver_status, v.status AS vehicle_status " +
  "FROM public.drivers d " +
  "CROSS JOIN public.vehicles v " +
  "WHERE d.id = $1 AND v.id = $2 " +
  "FOR UPDATE OF d, v",
  [driverId, vehicleId]
);

if (availability.rows.length === 0) {
  await client.query("ROLLBACK");
  transactionStarted = false;
  return res.status(404).json({ success: false, message: "Driver or vehicle not found." });
}

const { driver_status, vehicle_status } = availability.rows[0];

if (driver_status !== "available") {
  await client.query("ROLLBACK");
  transactionStarted = false;
  return res.status(409).json({ success: false, message: "Driver is not available." });
}

if (vehicle_status !== "available") {
  await client.query("ROLLBACK");
  transactionStarted = false;
  return res.status(409).json({ success: false, message: "Vehicle is not available." });
}

const result = await client.query(
  "INSERT INTO public.trips (driver_id, vehicle_id, origin, destination, status, start_time) " +
  "VALUES ($1, $2, $3, $4, $5::VARCHAR, CASE WHEN $5::VARCHAR = 'in_progress' THEN CURRENT_TIMESTAMP ELSE NULL END) " +
  "RETURNING *",
  [driverId, vehicleId, origin.trim(), destination.trim(), status]
  );
  
await client.query(
  "UPDATE public.drivers SET status = 'on_trip' WHERE id = $1",
  [driverId]
);

await client.query(
  "UPDATE public.vehicles SET status = 'on_trip' WHERE id = $1",
  [vehicleId]
);

await client.query("COMMIT");
transactionStarted = false;

res.status(201).json({
  success: true,
  message: "Trip created successfully.",
  data: result.rows[0]
});


} catch (error) {
if (client && transactionStarted) {
try {
await client.query("ROLLBACK");
} catch (rollbackError) {
console.error("Rollback error:", rollbackError.message);
}
}


console.error("Create trip error:", error.message);
res.status(500).json({ success: false, message: "Failed to create trip." });


} finally {
if (client) client.release();
}
});

router.put("/:id", async (req, res) => {
let client;
let transactionStarted = false;

try {
const id = Number(req.params.id);


if (!Number.isInteger(id) || id <= 0) {
  return res.status(400).json({ success: false, message: "Invalid trip ID." });
}

const { driverId, vehicleId, origin, destination, status } = req.body;

if (driverId !== undefined && (!Number.isInteger(driverId) || driverId <= 0)) {
  return res.status(400).json({ success: false, message: "driverId must be a positive integer." });
}

if (vehicleId !== undefined && (!Number.isInteger(vehicleId) || vehicleId <= 0)) {
  return res.status(400).json({ success: false, message: "vehicleId must be a positive integer." });
}

if (origin !== undefined && (typeof origin !== "string" || !origin.trim())) {
  return res.status(400).json({ success: false, message: "Origin must be a non-empty string." });
}

if (destination !== undefined && (typeof destination !== "string" || !destination.trim())) {
  return res.status(400).json({ success: false, message: "Destination must be a non-empty string." });
}

if (status !== undefined && (typeof status !== "string" || !allowedStatuses.includes(status))) {
  return res.status(400).json({
    success: false,
    message: "Status must be one of: " + allowedStatuses.join(", ") + "."
  });
}

client = await pool.connect();
await client.query("BEGIN");
transactionStarted = true;

const currentResult = await client.query(
  "SELECT * FROM public.trips WHERE id = $1 FOR UPDATE",
  [id]
);

if (currentResult.rows.length === 0) {
  await client.query("ROLLBACK");
  transactionStarted = false;
  return res.status(404).json({ success: false, message: "Trip not found." });
}

const currentTrip = currentResult.rows[0];
const nextStatus = status ?? currentTrip.status;
const nextDriverId = driverId ?? currentTrip.driver_id;
const nextVehicleId = vehicleId ?? currentTrip.vehicle_id;

if (currentTrip.status === "completed" || currentTrip.status === "cancelled") {
  await client.query("ROLLBACK");
  transactionStarted = false;
  return res.status(409).json({
    success: false,
    message: "A completed or cancelled trip cannot be modified."
  });
}

if (
  (nextStatus === "completed" || nextStatus === "cancelled") &&
  (nextDriverId !== currentTrip.driver_id || nextVehicleId !== currentTrip.vehicle_id)
) {
  await client.query("ROLLBACK");
  transactionStarted = false;
  return res.status(400).json({
    success: false,
    message: "Do not change the driver or vehicle while completing or cancelling a trip."
  });
}

if (
  nextDriverId !== currentTrip.driver_id ||
  nextVehicleId !== currentTrip.vehicle_id
) {
  const availability = await client.query(
    "SELECT d.id AS driver_id, d.status AS driver_status, " +
    "v.id AS vehicle_id, v.status AS vehicle_status " +
    "FROM public.drivers d " +
    "CROSS JOIN public.vehicles v " +
    "WHERE d.id = $1 AND v.id = $2 " +
    "FOR UPDATE OF d, v",
    [nextDriverId, nextVehicleId]
  );

  if (availability.rows.length === 0) {
    await client.query("ROLLBACK");
    transactionStarted = false;
    return res.status(404).json({
      success: false,
      message: "The specified driver or vehicle was not found."
    });
  }

  const resources = availability.rows[0];

  if (
    (nextDriverId !== currentTrip.driver_id && resources.driver_status !== "available") ||
    (nextVehicleId !== currentTrip.vehicle_id && resources.vehicle_status !== "available")
  ) {
    await client.query("ROLLBACK");
    transactionStarted = false;
    return res.status(409).json({
      success: false,
      message: "The replacement driver and vehicle must be available."
    });
  }

  if (nextDriverId !== currentTrip.driver_id) {
    await client.query(
      "UPDATE public.drivers SET status = 'available' WHERE id = $1",
      [currentTrip.driver_id]
    );
    await client.query(
      "UPDATE public.drivers SET status = 'on_trip' WHERE id = $1",
      [nextDriverId]
    );
  }

  if (nextVehicleId !== currentTrip.vehicle_id) {
    await client.query(
      "UPDATE public.vehicles SET status = 'available' WHERE id = $1",
      [currentTrip.vehicle_id]
    );
    await client.query(
      "UPDATE public.vehicles SET status = 'on_trip' WHERE id = $1",
      [nextVehicleId]
    );
  }
}

const result = await client.query(
  "UPDATE public.trips " +
  "SET driver_id = $1, " +
  "    vehicle_id = $2, " +
  "    origin = $3, " +
  "    destination = $4, " +
  "    status = $5::VARCHAR, " +
  "    start_time = CASE WHEN $5::VARCHAR = 'in_progress' AND start_time IS NULL THEN CURRENT_TIMESTAMP ELSE start_time END, " +
  "    end_time = CASE WHEN $5::VARCHAR IN ('completed', 'cancelled') THEN CURRENT_TIMESTAMP ELSE end_time END " +
  "WHERE id = $6 " +
  "RETURNING *",
  [
  nextDriverId,
  nextVehicleId,
  origin === undefined ? currentTrip.origin : origin.trim(),
  destination === undefined ? currentTrip.destination : destination.trim(),
  nextStatus,
  id
  ]
  );
  
if (nextStatus === "completed" || nextStatus === "cancelled") {
  await client.query(
    "UPDATE public.drivers d " +
    "SET status = CASE " +
    "WHEN EXISTS (" +
    "SELECT 1 FROM public.trips t " +
    "WHERE t.driver_id = d.id AND t.id <> $1 " +
    "AND t.status IN ('scheduled', 'in_progress')" +
    ") THEN 'on_trip' ELSE 'available' END " +
    "WHERE d.id = $2",
    [id, currentTrip.driver_id]
  );

  await client.query(
    "UPDATE public.vehicles v " +
    "SET status = CASE " +
    "WHEN EXISTS (" +
    "SELECT 1 FROM public.trips t " +
    "WHERE t.vehicle_id = v.id AND t.id <> $1 " +
    "AND t.status IN ('scheduled', 'in_progress')" +
    ") THEN 'on_trip' ELSE 'available' END " +
    "WHERE v.id = $2",
    [id, currentTrip.vehicle_id]
  );
}

await client.query("COMMIT");
transactionStarted = false;

res.status(200).json({
  success: true,
  message: "Trip updated successfully.",
  data: result.rows[0]
});


} catch (error) {
if (client && transactionStarted) {
try {
await client.query("ROLLBACK");
} catch (rollbackError) {
console.error("Rollback error:", rollbackError.message);
}
}


if (error.code === "23503") {
  return res.status(400).json({
    success: false,
    message: "The specified driver or vehicle does not exist."
  });
}

console.error("Update trip error:", error.message);
res.status(500).json({ success: false, message: "Failed to update trip." });


} finally {
if (client) client.release();
}
});

router.delete("/:id", async (req, res) => {
let client;
let transactionStarted = false;

try {
const id = Number(req.params.id);


if (!Number.isInteger(id) || id <= 0) {
  return res.status(400).json({ success: false, message: "Invalid trip ID." });
}

client = await pool.connect();
await client.query("BEGIN");
transactionStarted = true;

const tripResult = await client.query(
  "SELECT * FROM public.trips WHERE id = $1 FOR UPDATE",
  [id]
);

if (tripResult.rows.length === 0) {
  await client.query("ROLLBACK");
  transactionStarted = false;
  return res.status(404).json({ success: false, message: "Trip not found." });
}

const trip = tripResult.rows[0];

if (trip.status === "in_progress") {
  await client.query("ROLLBACK");
  transactionStarted = false;
  return res.status(409).json({
    success: false,
    message: "An in-progress trip cannot be deleted. Complete or cancel it first."
  });
}

await client.query("DELETE FROM public.trips WHERE id = $1", [id]);

await client.query(
  "UPDATE public.drivers d " +
  "SET status = CASE WHEN EXISTS (" +
  "SELECT 1 FROM public.trips t WHERE t.driver_id = d.id " +
  "AND t.status IN ('scheduled', 'in_progress')" +
  ") THEN 'on_trip' ELSE 'available' END " +
  "WHERE d.id = $1",
  [trip.driver_id]
);

await client.query(
  "UPDATE public.vehicles v " +
  "SET status = CASE WHEN EXISTS (" +
  "SELECT 1 FROM public.trips t WHERE t.vehicle_id = v.id " +
  "AND t.status IN ('scheduled', 'in_progress')" +
  ") THEN 'on_trip' ELSE 'available' END " +
  "WHERE v.id = $1",
  [trip.vehicle_id]
);

await client.query("COMMIT");
transactionStarted = false;

res.status(200).json({
  success: true,
  message: "Trip deleted successfully.",
  data: trip
});


} catch (error) {
if (client && transactionStarted) {
try {
await client.query("ROLLBACK");
} catch (rollbackError) {
console.error("Rollback error:", rollbackError.message);
}
}


console.error("Delete trip error:", error.message);
res.status(500).json({ success: false, message: "Failed to delete trip." });


} finally {
if (client) client.release();
}
});

module.exports = router;
