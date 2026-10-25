console.log("INDEX FILE LOADED");

const express = require("express");

const driversRouter = require("./routes/drivers");
const vehiclesRouter = require("./routes/vehicles");
const tripsRouter = require("./routes/trips");
const invoiceRoutes = require("./routes/invoices");

const app = express();

app.use(express.json());

app.use("/drivers", driversRouter);
app.use("/vehicles", vehiclesRouter);
app.use("/trips", tripsRouter);
app.use("/api/invoices", invoiceRoutes);

app.get("/", (req, res) => {
  res.json({
    project: "Transportation Management System",
    status: "Running"
  });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`TMS API running on port ${PORT}`);
});
