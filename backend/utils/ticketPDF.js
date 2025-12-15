const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const bwipjs = require("bwip-js"); // npm i bwip-js

const TICKETS_DIR = path.join(__dirname, "..", "tickets");
if (!fs.existsSync(TICKETS_DIR)) fs.mkdirSync(TICKETS_DIR, { recursive: true });

function formatDateParts(dateLike) {
  if (!dateLike) return { dateStr: "", timeStr: "" };
  const d = new Date(dateLike);
  if (isNaN(d)) return { dateStr: String(dateLike), timeStr: "" };
  const dateStr = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); // e.g. 12 Jun 2025
  const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); // e.g. 04:30
  return { dateStr, timeStr };
}

/**
 * generateTicket({ pnr, passenger_name, flight, amount_paid, booking_time, seat='27A', gate='03' })
 * Writes PDF to backend/tickets/<pnr>.pdf
 */
async function generateTicket({ pnr, passenger_name, flight = {}, amount_paid, booking_time, seat = "27A", gate = "03" }) {
  const filename = `${pnr}.pdf`;
  const outputPath = path.join(TICKETS_DIR, filename);

  // Try to create barcode buffer
  let barcodeBuffer = null;
  try {
    barcodeBuffer = await bwipjs.toBuffer({
      bcid: "code128",
      text: pnr,
      scale: 3,
      height: 40,
      includetext: false,
      backgroundcolor: "FFFFFF",
    });
  } catch (e) {
    console.warn("Barcode generation failed:", e);
    barcodeBuffer = null;
  }

  return new Promise((resolve, reject) => {
    try {
      
      const doc = new PDFDocument({
        size: [900, 320], // width x height in points
        margins: { top: 10, left: 10, right: 10, bottom: 10 },
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      // Colors
      const ACCENT = "#2563EB"; // blue-600
      const ACCENT_LIGHT = "#DBEAFE"; // light blue
      const DARK = "#0f1724";
      const LIGHT = "#ffffff";
      const MUTED = "#6b7280";

      // --- Left vertical stripe for branding ---
      doc.save();
      doc.rect(12, 12, 60, 296).fill(ACCENT);
      doc.fillColor("white").fontSize(28).text("✈", 28, 120, { align: "center" });
      doc.restore();

      // --- Top banner ---
      doc.save();
      doc.roundedRect(84, 16, 792, 48, 8).fill(ACCENT);
      doc.fillColor("white").font("Helvetica-Bold").fontSize(16).text("BOARDING PASS", 100, 28);
      doc.font("Helvetica").fontSize(12).text("FIRST CLASS", 760, 30, { align: "right" });
      doc.restore();

      // --- Perforation / dashed vertical line separating stub ---
      const perforationX = 740;
      doc.save();
      doc.lineWidth(1).strokeColor("#e2e8f0");
      for (let y = 80; y < 300; y += 8) {
        doc.moveTo(perforationX, y).lineTo(perforationX + 4, y).stroke();
      }
      doc.restore();

      // --- Main left area: passenger & flight info ---
      const leftX = 100;
      const leftY = 80;
      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("PASSENGER", leftX, leftY);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(DARK).text((passenger_name || "Passenger").toUpperCase(), leftX, leftY + 14);

      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("FLIGHT", leftX, leftY + 44);
      doc.font("Helvetica-Bold").fontSize(12).fillColor(DARK).text((flight.flight_no || flight.flight_id || "").toString(), leftX, leftY + 58);

      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("ROUTE", leftX, leftY + 86);
      doc.font("Helvetica").fontSize(11).fillColor(DARK).text(`${(flight.departure_city || "").toUpperCase()} → ${(flight.arrival_city || "").toUpperCase()}`, leftX, leftY + 100);

      // PNR and booking time small
      const { dateStr: bookingDateStr, timeStr: bookingTimeStr } = formatDateParts(booking_time);
      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("PNR", leftX, leftY + 130);
      doc.font("Helvetica-Bold").fontSize(11).fillColor(DARK).text(pnr, leftX + 30, leftY + 128);

      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("BOOKED", leftX, leftY + 150);
      doc.font("Helvetica").fontSize(11).fillColor(DARK).text(`${bookingDateStr} ${bookingTimeStr}`, leftX + 45, leftY + 148);

      // --- Middle area: huge FROM and TO city with times/dates ---
      const midX = 300;
      const cityY = 70;
      const depCity = (flight.departure_city || flight.from || "ORIGIN").toUpperCase();
      const arrCity = (flight.arrival_city || flight.to || "DESTINATION").toUpperCase();

      // departure column
      const depParts = formatDateParts(flight.departure_time || booking_time);
      doc.font("Helvetica-Bold").fontSize(28).fillColor(ACCENT).text(depCity, midX, cityY, { width: 200, align: "center" });
      doc.font("Helvetica").fontSize(11).fillColor(DARK).text(depParts.timeStr || "--:--", midX, cityY + 36, { width: 200, align: "center" });
      doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(depParts.dateStr || "", midX, cityY + 54, { width: 200, align: "center" });

      // arrival column
      const arrParts = formatDateParts(flight.arrival_time || booking_time);
      doc.font("Helvetica-Bold").fontSize(28).fillColor(ACCENT).text(arrCity, midX + 260, cityY, { width: 200, align: "center" });
      doc.font("Helvetica").fontSize(11).fillColor(DARK).text(arrParts.timeStr || "--:--", midX + 260, cityY + 36, { width: 200, align: "center" });
      doc.font("Helvetica").fontSize(10).fillColor(MUTED).text(arrParts.dateStr || "", midX + 260, cityY + 54, { width: 200, align: "center" });

      // small plane icon
      doc.fontSize(20).fillColor("#64748b").text("✈", midX + 230, cityY + 18);

      // --- Right area: gate, seat, price ---
      const rightX = 520;
      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("SEAT", rightX, 100);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(DARK).text(seat, rightX, 116);

      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("GATE", rightX, 150);
      doc.font("Helvetica-Bold").fontSize(16).fillColor(DARK).text(gate, rightX, 166);

      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("PRICE", rightX, 200);
      const priceStr = amount_paid ?? flight.current_price ?? flight.base_price ?? "-";
      doc.font("Helvetica-Bold").fontSize(14).fillColor(DARK).text(`₹${priceStr}`, rightX, 216);

      // --- Barcode stub on far right (vertical) ---
      const stubX = 760;
      const stubY = 40;
      const stubW = 110;
      const stubH = 240;

      // stub background
      doc.save();
      doc.roundedRect(stubX, stubY, stubW, stubH, 6).fill(LIGHT);
      doc.restore();

      // place barcode bitmap (centered)
      if (barcodeBuffer) {
        try {
          const bw = stubW - 20;
          const bh = 80;
          // draw barcode
          doc.image(barcodeBuffer, stubX + 10, stubY + 20, { width: bw, height: bh });
          // printed PNR under barcode
          doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK).text(pnr, stubX + 10, stubY + 110, { width: bw, align: "center" });
        } catch (e) {
          console.warn("draw barcode failed:", e);
        }
      } else {
        // fallback PNR text
        doc.font("Helvetica-Bold").fontSize(12).fillColor(DARK).text(pnr, stubX + 10, stubY + 40, { width: stubW - 20, align: "center" });
      }

      // stub small passenger summary (right column)
      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("PASSENGER", stubX + 10, stubY + 140);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK).text((passenger_name || "Passenger"), stubX + 10, stubY + 154, { width: stubW - 20, align: "center" });

      doc.font("Helvetica").fontSize(9).fillColor(MUTED).text("FLIGHT", stubX + 10, stubY + 174);
      doc.font("Helvetica-Bold").fontSize(10).fillColor(DARK).text((flight.flight_no || flight.flight_id || ""), stubX + 10, stubY + 188, { width: stubW - 20, align: "center" });

      // small icons / footers
      doc.font("Helvetica").fontSize(8).fillColor(MUTED).text("SkyWing", 100, 290);

      // finalize
      doc.end();

      stream.on("finish", () => resolve(outputPath));
      stream.on("error", (err) => reject(err));
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = generateTicket;