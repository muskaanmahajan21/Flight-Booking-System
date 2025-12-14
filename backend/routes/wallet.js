const express = require("express");
const router = express.Router();
const db = require("../db");

// GET wallet balance
router.get("/", (req, res) => {
  db.query("SELECT balance FROM wallet WHERE id = 1", (err, rows) => {
    if (err) {
      console.error("Wallet DB error:", err);
      return res.status(500).json({ error: err.message });
    }

    if (!rows[0]) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    res.json({ balance: rows[0].balance });
  });
});

module.exports = router;
