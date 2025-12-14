const express = require("express");
const cors = require("cors");
const db = require("./db");

const flightRoutes = require("./routes/flights");
const bookingRoute = require("./routes/bookings");
const walletRoutes = require("./routes/wallet");



const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/flights", flightRoutes);
app.use("/api/bookings", bookingRoute);
app.use("/api/wallet", walletRoutes);

app.get("/", (req, res) => {
  res.send("Flight Booking Backend Running");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
