import { useEffect, useState } from "react";
import api, { BACKEND_URL } from "../apis/api";

export default function History() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/bookings");
        setBookings(res.data);
      } catch {
        console.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-10 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-4 py-6">
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-sm text-gray-500">View and manage flight history</p>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        {bookings.length === 0 && <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">No bookings found</div>}

        {bookings.map((b) => (
          <div key={b.pnr} className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg">{b.airline}</h3>
              <p className="text-sm text-gray-600">{b.departure_city} → {b.arrival_city}</p>
              <p className="text-xs text-gray-500 mt-1">PNR: {b.pnr}</p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${b.status === "CANCELLED" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>{b.status || "CONFIRMED"}</span>
              <p className="font-bold text-lg">₹{b.amount_paid}</p>

              <div className="flex gap-3">
                <button onClick={() => window.open(`${BACKEND_URL}/tickets/${b.pnr}.pdf`, "_blank")} className="text-sm px-3 py-2 bg-sky-600 text-white rounded-lg">Download Ticket</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}