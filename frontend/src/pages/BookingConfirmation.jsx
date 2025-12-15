import { useLocation, useNavigate } from "react-router-dom";

const BACKEND_URL = "https://flight-booking-system-gfzh.onrender.com";

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { pnr, amount_paid, flight } = location.state || {};

  if (!pnr) {
    // If no PNR in state, redirect back to history
    navigate("/history");
    return null;
  }

  

  const ticketUrl = `${BACKEND_URL}/tickets/${pnr}.pdf`;



  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Booking Confirmed</h2>

      <div className="bg-white p-6 rounded shadow">
        <p className="mb-2"><strong>PNR:</strong> {pnr}</p>
        <p className="mb-2"><strong>Amount Paid:</strong> ₹{amount_paid}</p>
        {flight && (
          <>
            <p className="mb-2"><strong>Flight:</strong> {flight.airline} ({flight.flight_no || flight.flight_id})</p>
            <p className="mb-2"><strong>Route:</strong> {flight.departure_city} → {flight.arrival_city}</p>
          </>
        )}

        <div className="mt-4 flex gap-3">
          <a href={ticketUrl} target="_blank" rel="noopener noreferrer" className="bg-sky-600 text-white px-4 py-2 rounded">
            Download Ticket (PDF)
          </a>
          <button onClick={() => navigate("/history")} className="px-4 py-2 rounded border">
            View Booking History
          </button>
        </div>
      </div>
    </div>
  );
}