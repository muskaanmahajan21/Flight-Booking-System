const express = require("express");
const router = express.Router();
const db = require("../db");
const { applySurgePricing } = require("../utils/pricing");
const generateTicket = require("../utils/ticketPDF");
const { sendBookingEmail } = require("../utils/emailService");


router.get("/", (req, res) => {
  db.query(
    "SELECT * FROM bookings ORDER BY booking_time DESC",
    (err, rows) => {
      if (err) {
        console.error("DB error:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});


router.post("/", (req, res) => {
  const { passenger_name, flight_id } = req.body;

  if (!passenger_name || !flight_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  applySurgePricing(flight_id)
    .then((finalPrice) => {
      //  WALLET CHECK
      db.query("SELECT balance FROM wallet WHERE id = 1", (err, walletRows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!walletRows[0])
          return res.status(500).json({ error: "Wallet not found" });

        if (walletRows[0].balance < finalPrice) {
          return res.status(400).json({ error: "Insufficient wallet balance" });
        }

        // DEDUCT WALLET
        db.query(
          "UPDATE wallet SET balance = balance - ? WHERE id = 1",
          [finalPrice],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // FETCH FLIGHT
            db.query(
              "SELECT * FROM flights WHERE flight_id = ?",
              [flight_id],
              (err, flightRows) => {
                if (err) return res.status(500).json({ error: err.message });
                if (!flightRows[0])
                  return res.status(404).json({ error: "Flight not found" });

                const flight = flightRows[0];
                const pnr =
                  "PNR-" +
                  Math.random().toString(36).substring(2, 8).toUpperCase();

                // INSERT BOOKING
                db.query(
                  `INSERT INTO bookings
                   (passenger_name, flight_id, airline, departure_city, arrival_city, amount_paid, pnr, status)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
                  [
                    passenger_name,
                    flight.flight_id,
                    flight.airline,
                    flight.departure_city,
                    flight.arrival_city,
                    finalPrice,
                    pnr,
                  ],
                  async (err) => {
                    if (err)
                      return res.status(500).json({ error: err.message });

                    //  GENERATE TICKET PDF
                    generateTicket({
                      passenger_name,
                      flight,
                      price: finalPrice,
                      pnr,
                    });

                    //  SEND CONFIRMATION EMAIL
                    try {
                      await sendBookingEmail({
                        to: "customer@example.com", // replace later with real email
                        subject: "✈️ SkyWing Booking Confirmed",
                        html: `
                          <h2>Booking Confirmed</h2>
                          <p><b>Passenger:</b> ${passenger_name}</p>
                          <p><b>PNR:</b> ${pnr}</p>
                          <p><b>Airline:</b> ${flight.airline}</p>
                          <p><b>Route:</b> ${flight.departure_city} → ${flight.arrival_city}</p>
                          <p><b>Amount Paid:</b> ₹${finalPrice}</p>
                          <p><b>Booking Time:</b> ${new Date().toLocaleString()}</p>
                          <br/>
                          <p>You can download your ticket from <b>My Bookings</b>.</p>
                          <p>✈️ Happy Journey with SkyWing</p>
                        `,
                      });
                    } catch (emailErr) {
                      console.error("Email failed:", emailErr);
                    }

                    res.json({
                      message: "Booking successful",
                      pnr,
                      amount_paid: finalPrice,
                    });
                  }
                );
              }
            );
          }
        );
      });
    })
    .catch((err) => {
      console.error("Pricing error:", err);
      res.status(500).json({ error: "Pricing calculation failed" });
    });
});


router.post("/cancel/:pnr", (req, res) => {
  const { pnr } = req.params;

  db.query("SELECT * FROM bookings WHERE pnr = ?", [pnr], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows[0])
      return res.status(404).json({ error: "Booking not found" });

    const booking = rows[0];

    db.query(
      "UPDATE bookings SET status = 'CANCELLED' WHERE pnr = ?",
      [pnr],
      async (err) => {
        if (err) return res.status(500).json({ error: err.message });

        // SEND CANCELLATION EMAIL
        try {
          await sendBookingEmail({
            to: "customer@example.com",
            subject: "❌ SkyWing Booking Cancelled",
            html: `
              <h2>Booking Cancelled</h2>
              <p><b>PNR:</b> ${pnr}</p>
              <p><b>Airline:</b> ${booking.airline}</p>
              <p><b>Route:</b> ${booking.departure_city} → ${booking.arrival_city}</p>
              <p>Your booking has been successfully cancelled.</p>
              <br/>
              <p>We hope to serve you again ✈️</p>
            `,
          });
        } catch (emailErr) {
          console.error("Cancel email failed:", emailErr);
        }

        res.json({
          message: "Booking cancelled successfully",
          pnr,
        });
      }
    );
  });
});

module.exports = router;
