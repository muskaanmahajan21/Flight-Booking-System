const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateTicketPDF(booking) {
  const dir = path.join(__dirname, "..", "tickets");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const filePath = path.join(dir, `${booking.pnr}.pdf`);
  const doc = new PDFDocument();

  doc.pipe(fs.createWriteStream(filePath));

  doc.fontSize(18).text("Flight Ticket", { align: "center" });
  doc.moveDown();

  doc.fontSize(12).text(`Passenger Name: ${booking.passenger_name}`);
  doc.text(`Airline: ${booking.airline}`);
  doc.text(`Flight ID: ${booking.flight_id}`);
  doc.text(`Route: ${booking.departure_city} → ${booking.arrival_city}`);
  doc.text(`Amount Paid: ₹${booking.amount_paid}`);
  doc.text(`PNR: ${booking.pnr}`);
  doc.text(`Booking Time: ${new Date().toLocaleString()}`);

  doc.end();
}

module.exports = { generateTicketPDF };
