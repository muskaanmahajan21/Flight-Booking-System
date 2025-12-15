# ✈️ Flight Booking System 

A full-stack flight booking web application built using React, Node.js, Express, and MySQL.  
The system demonstrates real-world features such as dynamic pricing, wallet-based payments, booking history, and PDF ticket generation.

---

## 🚀 Features

### Flight Search
- Search flights by departure and arrival cities
- Flights fetched directly from MySQL database

### Dynamic Pricing
- Surge pricing applied when the same flight is booked multiple times within a time window
- Price resets after defined cooldown period

### Wallet System
- Default wallet balance ₹50,000
- Wallet balance fetched from database
- Automatic deduction on successful booking
- Booking blocked with clear error if balance is insufficient

### Booking & Tickets
- Book flights with real-time pricing
- Unique PNR generated for every booking
- PDF ticket generated with passenger & flight details
- Ticket can be downloaded anytime from booking history

### Booking History
- View all past bookings
- Shows flight details, amount paid, booking date & PNR
- Download ticket PDF again

---

## 🛠 Tech Stack

- **Frontend:** React (SPA)
- **Backend:** Node.js, Express
- **Database:** MySQL
- **Styling:** TailwindCSS
- **HTTP Client:** Axios

---

## ⚙️ Setup Instructions

### Backend
```bash
cd backend
npm install
node server.js

Frontend
cd frontend
npm install
npm start
