const pool = require("../db");

const SURGE_ATTEMPT_WINDOW_MIN = 5; 
const SURGE_RESET_MIN = 10; 
const SURGE_INCREASE = 0.10; 


async function applySurgePricing(flight_id, conn = null) {
  const useOwnConn = !conn;
  try {
    if (useOwnConn) conn = await pool.getConnection();
    
    await conn.execute("INSERT INTO surge_attempts (flight_id, attempt_time) VALUES (?, NOW())", [flight_id]);

    const [countRows] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM surge_attempts WHERE flight_id = ? AND attempt_time >= (NOW() - INTERVAL ? MINUTE)`,
      [flight_id, SURGE_ATTEMPT_WINDOW_MIN]
    );
    const attempts = countRows[0]?.cnt || 0;

    const [flightRows] = await conn.execute("SELECT base_price FROM flights WHERE flight_id = ?", [flight_id]);
    if (!flightRows[0]) throw new Error("Flight not found");

    const base = parseFloat(flightRows[0].base_price);

    if (attempts >= 3) {
      return +(base * (1 + SURGE_INCREASE)).toFixed(2);
    }

    return +base.toFixed(2);
  } finally {
    if (useOwnConn && conn) conn.release();
  }
}


async function getCurrentPriceForFlight(flight_id) {
  const conn = await pool.getConnection();
  try {
   
    const [countRows] = await conn.execute(
      `SELECT COUNT(*) as cnt FROM surge_attempts WHERE flight_id = ? AND attempt_time >= (NOW() - INTERVAL ? MINUTE)`,
      [flight_id, SURGE_ATTEMPT_WINDOW_MIN]
    );
    const attempts = countRows[0]?.cnt || 0;

    const [flightRows] = await conn.execute("SELECT base_price FROM flights WHERE flight_id = ?", [flight_id]);
    if (!flightRows[0]) throw new Error("Flight not found");
    const base = parseFloat(flightRows[0].base_price);
    if (attempts >= 3) return +(base * (1 + SURGE_INCREASE)).toFixed(2);
    return +base.toFixed(2);
  } finally {
    conn.release();
  }
}

module.exports = { applySurgePricing, getCurrentPriceForFlight };