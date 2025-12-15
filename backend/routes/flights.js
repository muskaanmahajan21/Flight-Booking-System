const express = require("express");
const router = express.Router();
const pool = require("../db");
const { getCurrentPriceForFlight } = require("../utils/pricing");

// Helper: pick first defined field from row among candidates
function getField(row, ...candidates) {
  for (const c of candidates) {
    if (row == null) break;
    if (Object.prototype.hasOwnProperty.call(row, c) && row[c] !== undefined && row[c] !== null) {
      return row[c];
    }
  }
  return null;
}

function formatTimeValue(t) {
  if (!t) return null;
  if (typeof t === "string") return t.length >= 5 ? t.slice(0, 5) : t;
  try {
    const dt = new Date(`1970-01-01T${t}`);
    return dt.toTimeString().slice(0, 5);
  } catch {
    return String(t).slice(0, 5);
  }
}

/**
 * GET /api/flights?from=&to=&page=
 * Uses SELECT * to avoid schema errors and maps available fields to a stable output.
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

    // Use SELECT * to avoid unknown-column errors on varied schemas
    const sql = `
      SELECT *
      FROM flights
      WHERE LOWER(${/* choose possible departure column name in WHERE using COALESCE if supported */ 'departure_city'}) LIKE ?
        AND LOWER(${/* same for arrival */ 'arrival_city'}) LIKE ?
      ORDER BY id ASC
      LIMIT ? OFFSET ?
    `;

    // If your schema does not have departure_city/arrival_city columns, the WHERE clause above could still error.
    // To be maximally defensive, we will try the query with the common names first and if it fails,
    // fall back to retrieving all flights and filter in JS.
    let rows;
    try {
      const [result] = await conn.execute(sql, [`%${from}%`, `%${to}%`, limit, offset]);
      rows = result;
    } catch (e) {
      // Fallback: select all rows and filter in JS (safer for unknown schemas)
      console.warn("Fallback: flights WHERE columns not present, filtering in JS. Error:", e.message);
      const [all] = await conn.execute("SELECT * FROM flights ORDER BY id ASC");
      rows = all.filter((r) => {
        const dep = String(getField(r, "departure_city", "departure", "departureCity", "from", "from_city") || "").toLowerCase();
        const arr = String(getField(r, "arrival_city", "arrival", "arrivalCity", "to", "to_city") || "").toLowerCase();
        return dep.includes(from) && arr.includes(to);
      }).slice(offset, offset + limit);
    }

    const enrichedFlights = [];
    for (const f of rows) {
      // get flight_id (prefer common names)
      const flight_id = getField(f, "flight_id", "flightId", "id", "flightID", "flight");
      const airline = getField(f, "airline", "carrier", "airline_name");
      const flight_no = getField(f, "flight_no", "flightNumber", "flight_no", "flight_no_str");
      const departure_city = getField(f, "departure_city", "departure", "departureCity", "from", "from_city");
      const arrival_city = getField(f, "arrival_city", "arrival", "arrivalCity", "to", "to_city");
      const departure_time_raw = getField(f, "departure_time", "departureTime", "dep_time", "dep_time_str");
      const arrival_time_raw = getField(f, "arrival_time", "arrivalTime", "arr_time", "arr_time_str");
      const duration = getField(f, "duration", "flight_duration");
      const base_price = parseFloat(getField(f, "base_price", "price", "fare") || 0);

      // compute current price if flight_id exists, otherwise fallback to base_price
      let current_price = base_price;
      try {
        if (flight_id) {
          current_price = await getCurrentPriceForFlight(flight_id);
        }
      } catch (e) {
        // pricing util may fail if tables missing — fallback silently
        console.warn("Pricing lookup failed for", flight_id, e.message);
        current_price = base_price;
      }

      enrichedFlights.push({
        flight_id,
        airline,
        flight_no,
        departure_city,
        arrival_city,
        departure_time: formatTimeValue(departure_time_raw),
        arrival_time: formatTimeValue(arrival_time_raw),
        duration,
        base_price,
        current_price,
        // include original row for debugging if needed (remove in production)
        // raw: f
      });
    }

    return res.json(enrichedFlights);
  } catch (err) {
    console.error("GET /flights error:", err);
    return res.status(500).json({ error: "Failed to fetch flights" });
  } finally {
    if (conn) conn.release();
  }
});

/**
 * GET /api/flights/:id
 * Return single flight by id (handles varied column names)
 */
router.get("/flights/:id", async (req, res) => {
  const flightIdParam = req.params.id;
  if (!flightIdParam) return res.status(400).json({ error: "Missing flight id" });

  let conn;
  try {
    conn = await pool.getConnection();

    // Try to find by common columns; try flight_id first then id
    const [rowsByFlightId] = await conn.execute("SELECT * FROM flights WHERE flight_id = ? LIMIT 1", [flightIdParam]).catch(() => [ [] ]);
    let row = rowsByFlightId[0];

    if (!row) {
      // try searching by id numeric
      const [rowsById] = await conn.execute("SELECT * FROM flights WHERE id = ? LIMIT 1", [flightIdParam]).catch(() => [ [] ]);
      row = rowsById[0];
    }

    if (!row) {
      // try other possible columns
      const [rows] = await conn.execute("SELECT * FROM flights").catch(() => [ [] ]);
      row = rows.find(r =>
        String(getField(r, "flight_id", "flightId", "id") || "").toLowerCase() === String(flightIdParam).toLowerCase()
      );
    }

    if (!row) return res.status(404).json({ error: "Flight not found" });

    const flight_id = getField(row, "flight_id", "flightId", "id");
    const airline = getField(row, "airline", "carrier", "airline_name");
    const flight_no = getField(row, "flight_no", "flightNumber", "flight_no");
    const departure_city = getField(row, "departure_city", "departure", "departureCity", "from", "from_city");
    const arrival_city = getField(row, "arrival_city", "arrival", "arrivalCity", "to", "to_city");
    const departure_time_raw = getField(row, "departure_time", "departureTime", "dep_time");
    const arrival_time_raw = getField(row, "arrival_time", "arrivalTime", "arr_time");
    const duration = getField(row, "duration", "flight_duration");
    const base_price = parseFloat(getField(row, "base_price", "price", "fare") || 0);

    let current_price = base_price;
    try {
      if (flight_id) current_price = await getCurrentPriceForFlight(flight_id);
    } catch (e) {
      console.warn("Pricing lookup failed for", flight_id, e.message);
    }

    return res.json({
      flight_id,
      airline,
      flight_no,
      departure_city,
      arrival_city,
      departure_time: formatTimeValue(departure_time_raw),
      arrival_time: formatTimeValue(arrival_time_raw),
      duration,
      base_price,
      current_price,
    });
  } catch (err) {
    console.error("GET /flights/:id error:", err);
    return res.status(500).json({ error: "Failed to fetch flight" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;