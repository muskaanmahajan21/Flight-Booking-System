const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const flightsRouter = require('./routes/flights');
const bookingsRouter = require('./routes/bookings');
const walletRouter = require('./routes/wallet');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api', flightsRouter);
app.use('/api', bookingsRouter);
app.use('/api', walletRouter);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});