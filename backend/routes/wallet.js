const express = require("express");
const router = express.Router();
const pool = require("../db");

router.get("/wallet", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT balance FROM wallet WHERE id = 1");
    if (!rows[0]) return res.status(404).json({ error: "Wallet not found" });
    res.json({ balance: parseFloat(rows[0].balance) });
  } catch (err) {
    console.error("Wallet DB error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;