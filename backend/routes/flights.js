const express = require("express");
const router = express.Router();
const pool = require("../db");
const { getCurrentPriceForFlight } = require("../utils/pricing");

/**
 * GET /api/flights?from=&to=&page=
 */
router.get("/flights", async (req, res) => {
  let conn;

  try {
    conn = await pool.getConnection();

    const from = (req.query.from || "").toLowerCase();
    const to = (req.query.to || "").toLowerCase();
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);

    const limit = 10;
    const offset = (page - 1) * limit;

    const sql = `
      SELECT *
      FROM flights
      WHERE LOWER(departure_city) LIKE ?
        AND LOWER(arrival_city) LIKE ?
      ORDER BY id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const params = [`%${from}%`, `%${to}%`];

    const [flights] = await conn.execute(sql, params);

    if (flights.length === 0) {
      return res.json([]);
    }

    // Apply pricing
    const enrichedFlights = [];
    for (const f of flights) {
      const price = await getCurrentPriceForFlight(conn, f, null);
      enrichedFlights.push({
        flight_id: f.flight_id,
        airline: f.airline,
        departure_city: f.departure_city,
        arrival_city: f.arrival_city,
        base_price: f.base_price,
        current_price: price,
      });
    }

    res.json(enrichedFlights);
  } catch (err) {
    console.error("GET /flights error:", err);
    res.status(500).json({ error: "Failed to fetch flights" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
