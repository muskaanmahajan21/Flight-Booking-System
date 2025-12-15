const pool = require("./db");
const flights = [
  
  { flight_id: "FL101", airline: "IndiGo", flight_no: "6E101", departure_city: "Delhi", arrival_city: "Mumbai", departure_time: "07:00:00", arrival_time: "09:05:00", duration: "2h05m", base_price: 2000 },
  { flight_id: "FL102", airline: "Air India", flight_no: "AI102", departure_city: "Delhi", arrival_city: "Mumbai", departure_time: "08:15:00", arrival_time: "10:30:00", duration: "2h15m", base_price: 2100 },
  { flight_id: "FL103", airline: "Vistara", flight_no: "UK103", departure_city: "Delhi", arrival_city: "Mumbai", departure_time: "09:00:00", arrival_time: "11:05:00", duration: "2h05m", base_price: 2200 },
  { flight_id: "FL104", airline: "SpiceJet", flight_no: "SG104", departure_city: "Delhi", arrival_city: "Mumbai", departure_time: "10:00:00", arrival_time: "12:05:00", duration: "2h05m", base_price: 2300 },
  { flight_id: "FL105", airline: "Akasa", flight_no: "QP105", departure_city: "Delhi", arrival_city: "Mumbai", departure_time: "11:00:00", arrival_time: "13:05:00", duration: "2h05m", base_price: 2400 },
  { flight_id: "FL106", airline: "GoAir", flight_no: "G8106", departure_city: "Delhi", arrival_city: "Mumbai", departure_time: "12:00:00", arrival_time: "14:05:00", duration: "2h05m", base_price: 2500 },
  { flight_id: "FL107", airline: "IndiGo", flight_no: "6E107", departure_city: "Delhi", arrival_city: "Kolkata", departure_time: "07:30:00", arrival_time: "09:50:00", duration: "2h20m", base_price: 2600 },
  { flight_id: "FL108", airline: "SpiceJet", flight_no: "SG108", departure_city: "Delhi", arrival_city: "Kolkata", departure_time: "19:30:00", arrival_time: "21:55:00", duration: "2h25m", base_price: 2700 },
  { flight_id: "FL109", airline: "Vistara", flight_no: "UK109", departure_city: "Mumbai", arrival_city: "Bangalore", departure_time: "06:00:00", arrival_time: "07:30:00", duration: "1h30m", base_price: 2800 },
  { flight_id: "FL110", airline: "Air India", flight_no: "AI110", departure_city: "Mumbai", arrival_city: "Bangalore", departure_time: "14:00:00", arrival_time: "15:30:00", duration: "1h30m", base_price: 2900 },
];

async function run() {
  try {
   
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS flights (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flight_id VARCHAR(64) UNIQUE NOT NULL,
        airline VARCHAR(128) NOT NULL,
        flight_no VARCHAR(64),
        departure_city VARCHAR(128) NOT NULL,
        arrival_city VARCHAR(128) NOT NULL,
        departure_time TIME,
        arrival_time TIME,
        duration VARCHAR(32),
        base_price DECIMAL(10,2) NOT NULL
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pnr VARCHAR(64) UNIQUE NOT NULL,
        passenger_name VARCHAR(255) NOT NULL,
        flight_id VARCHAR(64) NOT NULL,
        amount_paid DECIMAL(10,2) NOT NULL,
        booking_time DATETIME NOT NULL,
        departure_city VARCHAR(128),
        arrival_city VARCHAR(128),
        airline VARCHAR(128),
        status VARCHAR(32) DEFAULT 'CONFIRMED'
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS wallet (
        id INT PRIMARY KEY,
        balance DECIMAL(15,2) DEFAULT 50000
      )
    `);

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS surge_attempts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        flight_id VARCHAR(64) NOT NULL,
        attempt_time DATETIME NOT NULL,
        INDEX (flight_id),
        INDEX (attempt_time)
      )
    `);


    for (const f of flights) {
      await pool.execute(
        `INSERT INTO flights (flight_id, airline, flight_no, departure_city, arrival_city, departure_time, arrival_time, duration, base_price)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE airline = VALUES(airline), flight_no = VALUES(flight_no), departure_city = VALUES(departure_city), arrival_city = VALUES(arrival_city), departure_time = VALUES(departure_time), arrival_time = VALUES(arrival_time), duration = VALUES(duration), base_price = VALUES(base_price)`,
        [f.flight_id, f.airline, f.flight_no, f.departure_city, f.arrival_city, f.departure_time, f.arrival_time, f.duration, f.base_price]
      );
    }

    
    await pool.execute(`INSERT INTO wallet (id, balance) VALUES (1, 50000) ON DUPLICATE KEY UPDATE balance = balance`);

    console.log("Seeding completed");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

run();