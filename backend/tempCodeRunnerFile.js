db.query("SELECT * FROM bookings ORDER BY booking_time DESC", (err, rows) => {
  if (err) {
    console.error("Failed to fetch bookings:", err);
    return res.status(500).json({ error: "Failed to fetch bookings" });
  }
  res.json(rows);
});