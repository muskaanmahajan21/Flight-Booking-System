const express = require("express");
const router = express.Router();
const db = require("../db");
const { applySurgePricing } = require("../utils/pricing");
const generateTicket = require("../utils/ticketPDF");

/* GET Booking History*/
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

/* POST New Booking */
router.post("/", (req, res) => {
  const { passenger_name, flight_id } = req.body;

  if (!passenger_name || !flight_id) {
    return res.status(400).json({ error: "Missing fields" });
  }

  applySurgePricing(flight_id)
    .then((finalPrice) => {
      // Wallet check
      db.query("SELECT balance FROM wallet WHERE id = 1", (err, walletRows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!walletRows[0])
          return res.status(500).json({ error: "Wallet not found" });

        if (walletRows[0].balance < finalPrice) {
          return res.status(400).json({ error: "Insufficient wallet balance" });
        }

        // Deduct wallet
        db.query(
          "UPDATE wallet SET balance = balance - ? WHERE id = 1",
          [finalPrice],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });

            // Get flight
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

                // Insert booking
                db.query(
                  `INSERT INTO bookings
                  (passenger_name, flight_id, airline, departure_city, arrival_city, amount_paid, pnr)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    passenger_name,
                    flight.flight_id,
                    flight.airline,
                    flight.departure_city,
                    flight.arrival_city,
                    finalPrice,
                    pnr,
                  ],
                  (err) => {
                    if (err)
                      return res.status(500).json({ error: err.message });

                    //  Generate ticket
                    generateTicket({
                      passenger_name,
                      flight,
                      price: finalPrice,
                      pnr,
                    });

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

module.exports = router;
