import { useEffect, useState } from "react";
import api from "../apis/api";

export default function History() {
  const [bookings, setBookings] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);


  const [tab, setTab] = useState("upcoming");
  const [pnrSearch, setPnrSearch] = useState("");
  const [airlineFilter, setAirlineFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");


  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get("/bookings");
        setBookings(res.data);
        setFiltered(res.data);
      } catch {
        console.error("Failed to fetch bookings");
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    const today = new Date();

    let data = [...bookings];

    
    data = data.filter((b) => {
      const journey = new Date(b.journey_date || b.booking_time);
      return tab === "upcoming"
        ? journey >= today
        : journey < today;
    });

  
    if (pnrSearch) {
      data = data.filter((b) =>
        b.pnr.toLowerCase().includes(pnrSearch.toLowerCase())
      );
    }

    if (airlineFilter) {
      data = data.filter((b) => b.airline === airlineFilter);
    }

    if (dateFilter) {
      data = data.filter(
        (b) =>
          new Date(b.journey_date || b.booking_time)
            .toISOString()
            .slice(0, 10) === dateFilter
      );
    }

    setFiltered(data);
  }, [tab, pnrSearch, airlineFilter, dateFilter, bookings]);


  const cancelBooking = async (pnr) => {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      await api.post(`/bookings/${pnr}/cancel`);
      setBookings((prev) =>
        prev.map((b) =>
          b.pnr === pnr ? { ...b, status: "CANCELLED" } : b
        )
      );
    } catch {
      alert("Cancellation failed");
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto mt-10 space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 bg-gray-200 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-4 py-6">

      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-6">
        <h1 className="text-2xl font-bold">My Bookings</h1>
        <p className="text-sm text-gray-500">
          View and manage flight history
        </p>
      </div>

      {/* TABS */}
      <div className="max-w-6xl mx-auto flex gap-4 mb-4">
        {["upcoming", "past"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full font-semibold ${
              tab === t
                ? "bg-sky-600 text-white"
                : "bg-white text-gray-600 shadow"
            }`}
          >
            {t === "upcoming" ? "Upcoming Trips" : "Past Trips"}
          </button>
        ))}
      </div>

      {/* FILTER BAR */}
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow p-4 flex flex-wrap gap-4 mb-6">
        <input
          placeholder="Search by PNR"
          value={pnrSearch}
          onChange={(e) => setPnrSearch(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />

        <select
          value={airlineFilter}
          onChange={(e) => setAirlineFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        >
          <option value="">All Airlines</option>
          {[...new Set(bookings.map((b) => b.airline))].map(
            (air) => (
              <option key={air}>{air}</option>
            )
          )}
        </select>

        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border rounded-lg px-3 py-2"
        />
      </div>

      {/* BOOKINGS LIST */}
      <div className="max-w-6xl mx-auto space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-xl shadow p-6 text-center text-gray-500">
            No bookings found
          </div>
        )}

        {filtered.map((b) => (
          <div
            key={b.pnr}
            className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row justify-between gap-4"
          >
            {/* LEFT */}
            <div>
              <h3 className="font-bold text-lg">{b.airline}</h3>
              <p className="text-sm text-gray-600">
                {b.departure_city} → {b.arrival_city}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNR: {b.pnr}
              </p>
            </div>

            {/* RIGHT */}
            <div className="flex flex-col items-end gap-2">
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  b.status === "CANCELLED"
                    ? "bg-red-100 text-red-600"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {b.status || "CONFIRMED"}
              </span>

              <p className="font-bold text-lg">₹{b.amount_paid}</p>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    window.open(
                      `http://localhost:5000/tickets/${b.pnr}.pdf`,
                      "_blank"
                    )
                  }
                  className="text-sm px-3 py-2 bg-sky-600 text-white rounded-lg"
                >
                  Download Ticket
                </button>

                {tab === "upcoming" && b.status !== "CANCELLED" && (
                  <button
                    onClick={() => cancelBooking(b.pnr)}
                    className="text-sm px-3 py-2 border border-red-500 text-red-500 rounded-lg"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
