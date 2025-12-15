const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const flightsRouter = require('./routes/flights');
const bookingsRouter = require('./routes/bookings');
const walletRouter = require('./routes/wallet');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', flightsRouter);
app.use('/api', bookingsRouter);
app.use('/api', walletRouter);

// Serve ticket PDFs saved by ticket generator
app.use('/tickets', express.static(path.join(__dirname, 'tickets')));

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});