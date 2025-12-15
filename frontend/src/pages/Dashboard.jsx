import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../apis/api";
import { useAuth } from "../auth/AuthContext";
import TravellerSelector from "../components/TravellerSelector";

export default function Dashboard() {
  const { logout } = useAuth();

  const [tripType, setTripType] = useState("oneway");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [departureDate, setDepartureDate] = useState(""); // ISO yyyy-mm-dd
  const [returnDate, setReturnDate] = useState("");

  const [showTraveller, setShowTraveller] = useState(false);
  const [travellers, setTravellers] = useState({
    adults: 1,
    children: 0,
    cabin: "Economy",
  });

  const [flights, setFlights] = useState([]);
  const [wallet, setWallet] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingKey, setProcessingKey] = useState(null); // unique per-card (flight_id || idx)
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/wallet").then((res) => setWallet(res.data.balance)).catch(() => {});
  }, []);

  useEffect(() => {
    const close = () => setShowTraveller(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const searchFlights = async () => {
    if (!from || !to || !departureDate) {
      setError("Please fill From, To and Depart date");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await api.get(
        `/flights?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${encodeURIComponent(departureDate)}`
      );

      setFlights(res.data || []);
    } catch (err) {
      console.error("Failed to fetch flights:", err);
      setError("Failed to fetch flights");
      setFlights([]);
    } finally {
      setLoading(false);
    }
  };

  const bookFlight = async (flightId, idx, flightObject = null) => {
    const cardKey = flightId || `idx-${idx}`;
    console.log("Booking clicked", { flightId, idx, cardKey, flightObject });

    setProcessingKey(cardKey);
    try {
      const res = await api.post("/bookings", {
        passenger_name: "SkyWing User",
        flight_id: flightId,
      });

      console.log("Booking response:", res.data);
      alert(`Booking Successful ✈️\nPNR: ${res.data.pnr}\nPaid: ₹${res.data.amount_paid}`);

      // refresh wallet
      try {
        const walletRes = await api.get("/wallet");
        setWallet(walletRes.data.balance);
      } catch (e) {
        console.warn("Could not refresh wallet:", e);
      }

      
    } catch (err) {
      console.error("Book error (frontend):", err);
    
      const serverMsg = err.response?.data?.error;
      alert(serverMsg || err.message || "Booking failed");
    } finally {
      setProcessingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white px-4 py-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-600 text-white flex items-center justify-center rounded-full">✈</div>
          <div>
            <h1 className="text-xl font-bold">SkyWing</h1>
            <p className="text-sm text-gray-500">Seamless Flight Booking</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => (window.location.href = "/history")} className="text-sky-600 font-semibold hover:underline">My Bookings</button>

          <div className="bg-white px-4 py-2 rounded-full shadow font-semibold">₹ {wallet}</div>

          <button onClick={logout} className="text-red-500 font-semibold">Logout</button>
        </div>
      </div>

      {/* SEARCH CARD */}
      <div className="bg-white rounded-3xl shadow-xl p-6 max-w-6xl mx-auto">
        <div className="flex gap-6 mb-4">
          {["oneway", "round", "multi"].map((t) => (
            <label key={t} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={tripType === t} onChange={() => setTripType(t)} />
              {t === "oneway" ? "One Way" : t === "round" ? "Round Trip" : "Multi City"}
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 border rounded-2xl">
          <div className="p-4 border-r">
            <p className="text-xs text-gray-500">From</p>
            <input className="w-full outline-none font-semibold" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="p-4 border-r">
            <p className="text-xs text-gray-500">To</p>
            <input className="w-full outline-none font-semibold" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="p-4 border-r">
            <p className="text-xs text-gray-500">Depart</p>
            <input type="date" className="w-full outline-none font-semibold" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)} />
          </div>

          <div className="p-4 border-r">
            <p className="text-xs text-gray-500">Return</p>
            <input type="date" disabled={tripType !== "round"} className="w-full outline-none font-semibold disabled:opacity-40" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
          </div>

          <div className="p-4 relative">
            <p className="text-xs text-gray-500">Travellers & cabin</p>
            <button
              className="font-semibold w-full text-left"
              onClick={(e) => {
                e.stopPropagation();
                setShowTraveller((prev) => !prev);
              }}
            >
              {travellers.adults} Adult{travellers.children > 0 && `, ${travellers.children} Child`}, {travellers.cabin}
            </button>

            {showTraveller && (
              <div className="absolute right-0 top-full mt-3 z-50" onClick={(e) => e.stopPropagation()}>
                <TravellerSelector
                  initial={travellers}
                  onApply={(data) => {
                    setTravellers(data);
                    setShowTraveller(false);
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <button onClick={searchFlights} className="mt-6 w-full bg-sky-600 text-white py-3 rounded-xl font-semibold">
          {loading ? "Searching..." : "Search Flights"}
        </button>

        {error && <p className="text-red-500 mt-3">{error}</p>}
      </div>

      {/* RESULTS */}
      <div className="max-w-6xl mx-auto mt-8">
        {loading && <p className="text-center text-gray-500">Loading flights...</p>}

        {!loading && flights.length === 0 && <p className="text-center text-gray-500 mt-6">No flights found for this route</p>}

        {flights.map((f, idx) => {
          const cardKey = f.flight_id || f.flightId || `idx-${idx}`;
          const price = f.current_price ?? f.currentPrice ?? f.base_price ?? f.basePrice ?? "—";
          const isProcessing = processingKey === cardKey;

          return (
            <div key={cardKey} className="bg-white p-4 rounded-xl shadow flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold">{f.airline}</h3>
                <p className="text-sm">{f.departure_city ?? f.departureCity} → {f.arrival_city ?? f.arrivalCity}</p>
              </div>

              <div className="flex items-center gap-4">
                <p className="font-bold text-lg">₹{price}</p>
                <button
                  onClick={() => bookFlight(f.flight_id || f.flightId, idx, f)}
                  className={`px-4 py-2 rounded-lg text-white ${isProcessing ? "bg-gray-400 cursor-wait" : "bg-green-500 hover:bg-green-600"}`}
                  disabled={isProcessing}
                >
                  {isProcessing ? "Processing..." : "Book"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}