const db = require("../db");

function applySurgePricing(flight_id, callback) {
  // Count attempts in last 5 minutes
  const checkSql = `
    SELECT COUNT(*) AS attempts
    FROM booking_attempts
    WHERE flight_id = ?
    AND attempt_time >= NOW() - INTERVAL 5 MINUTE
  `;

  db.query(checkSql, [flight_id], (err, result) => {
    if (err) return callback(err);

    const attempts = result[0].attempts;

    if (attempts >= 3) {
      // Increase price by 10%
      const surgeSql = `
        UPDATE flights
        SET current_price = ROUND(base_price * 1.1)
        WHERE flight_id = ?
      `;
      db.query(surgeSql, [flight_id]);
    }

    // Insert new booking attempt
    db.query(
      "INSERT INTO booking_attempts (flight_id) VALUES (?)",
      [flight_id]
    );

    callback(null);
  });
}

module.exports = { applySurgePricing };
