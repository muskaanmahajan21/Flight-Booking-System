const express = require("express");
const router = express.Router();
const pool = require("../db");
const { applySurgePricing } = require("../utils/pricing");
const generateTicket = require("../utils/ticketPDF");

router.get("/bookings", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM bookings ORDER BY booking_time DESC");
    res.json(rows);
  } catch (err) {
    console.error("DB error (GET /bookings):", err);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
});


router.post("/bookings", async (req, res) => {
  console.log("POST /api/bookings body:", req.body);

  const passenger_name = (req.body && req.body.passenger_name) || "";
  const flight_id = (req.body && req.body.flight_id) || "";

  if (!passenger_name || !flight_id) {
    return res.status(400).json({ error: "Missing fields: passenger_name and flight_id are required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

  
    const finalPrice = await applySurgePricing(flight_id, conn);

    
    const [walletRows] = await conn.execute("SELECT balance FROM wallet WHERE id = 1 FOR UPDATE");
    if (!walletRows[0]) {
      await conn.rollback();
      return res.status(500).json({ error: "Wallet not found" });
    }

    const currentBalance = parseFloat(walletRows[0].balance);
    if (currentBalance < finalPrice) {
      await conn.rollback();
      return res.status(400).json({ error: "Insufficient wallet balance" });
    }

    // Deduct wallet
    await conn.execute("UPDATE wallet SET balance = balance - ? WHERE id = 1", [finalPrice]);

    const [flightRows] = await conn.execute("SELECT * FROM flights WHERE flight_id = ?", [flight_id]);
    if (!flightRows[0]) {
      await conn.rollback();
      return res.status(404).json({ error: "Flight not found" });
    }
    const flight = flightRows[0];

    // Generate PNR and insert booking
    const pnr = "PNR-" + Date.now().toString(36).toUpperCase().slice(-8);
    const bookingTime = new Date();

    await conn.execute(
      `INSERT INTO bookings (pnr, passenger_name, flight_id, amount_paid, booking_time, departure_city, arrival_city, airline, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [pnr, passenger_name, flight_id, finalPrice, bookingTime, flight.departure_city, flight.arrival_city, flight.airline, "CONFIRMED"]
    );

    await conn.commit();

    // Generate ticket PDF asynchronously (non-blocking)
    (async () => {
      try {
        await generateTicket({
          pnr,
          passenger_name,
          flight,
          amount_paid: finalPrice,
          booking_time: bookingTime,
        });
      } catch (e) {
        console.warn("Ticket generation warning:", e);
      }
    })();

    console.log(`Booking successful: PNR=${pnr}, flight_id=${flight_id}, amount=${finalPrice}`);
    return res.json({ pnr, amount_paid: finalPrice });
  } catch (err) {
    console.error("Booking error:", err);
    if (conn) {
      try {
        await conn.rollback();
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }
    
    return res.status(500).json({ error: err.message || "Booking failed due to server error" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;