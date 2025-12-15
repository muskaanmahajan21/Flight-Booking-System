const db = require("../db");

/**
 * Calculate current price (used during SEARCH)
 */
async function getCurrentPriceForFlight(conn, flight, userId = null) {
  let price = flight.base_price;

  // Simple surge logic
  if (flight.current_price && flight.current_price > flight.base_price) {
    price = flight.current_price;
  }

  return price;
}

/**
 * Apply surge pricing (used during BOOKING)
 */
function applySurgePricing(flight_id) {
  return new Promise((resolve, reject) => {
    const countSql = `
      SELECT COUNT(*) AS attempts
      FROM booking_attempts
      WHERE flight_id = ?
      AND attempt_time >= NOW() - INTERVAL 5 MINUTE
    `;

    db.query(countSql, [flight_id], (err, rows) => {
      if (err) return reject(err);

      const attempts = rows[0].attempts;

      let finalPriceSql = `
        SELECT base_price FROM flights WHERE flight_id = ?
      `;

      db.query(finalPriceSql, [flight_id], (err, priceRows) => {
        if (err) return reject(err);

        let price = priceRows[0].base_price;

        // Apply surge after 3 attempts
        if (attempts >= 3) {
          price = Math.round(price * 1.1);

          db.query(
            `UPDATE flights SET current_price = ? WHERE flight_id = ?`,
            [price, flight_id]
          );
        }

        // Log booking attempt
        db.query(
          "INSERT INTO booking_attempts (flight_id) VALUES (?)",
          [flight_id]
        );

        resolve(price);
      });
    });
  });
}

module.exports = {
  getCurrentPriceForFlight,
  applySurgePricing,
};
