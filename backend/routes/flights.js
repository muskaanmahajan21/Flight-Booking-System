const express = require("express");
const db = require("../db");

const router = express.Router();

router.get("/", (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({
      error: "Departure and arrival cities are required"
    });
  }

  const sql = `
    SELECT * FROM flights
    WHERE departure_city = ? AND arrival_city = ?
    LIMIT 10
  `;

  db.query(sql, [from, to], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }

    res.json(results);
  });
});

module.exports = router;
