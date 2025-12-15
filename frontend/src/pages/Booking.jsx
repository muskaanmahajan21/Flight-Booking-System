import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import api from "../apis/api";

export default function Booking() {
  const { flightId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [flight, setFlight] = useState(location.state?.flight || null);
  const [loading, setLoading] = useState(!location.state?.flight);
  const [submitting, setSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  useEffect(() => {
    if (!flight && flightId) {
      api
        .get(`/flights/${encodeURIComponent(flightId)}`)
        .then((res) => setFlight(res.data))
        .catch(() => {
          alert("Could not load flight details");
          navigate("/");
        })
        .finally(() => setLoading(false));
    }
  }, [flightId, flight, navigate]);

  // 🔐 PREVENT BLANK PAGE
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        Loading flight details...
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-red-500">
        Flight not found
      </div>
    );
  }

  const handleConfirm = async (e) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !mobile) {
      alert("Please fill all passenger details");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/bookings", {
        passenger_name: `${firstName} ${lastName}`,
        flight_id: flight.flight_id,
        email,
        mobile,
      });

      navigate("/booking-confirmation", {
        state: {
          pnr: res.data.pnr,
          amount_paid: res.data.amount_paid,
          flight,
        },
      });
    } catch (err) {
      alert(err.response?.data?.error || "Booking failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">
        Booking – {flight.airline} ({flight.flight_no || flight.flight_id})
      </h2>

      <div className="bg-white p-4 rounded shadow mb-6">
        <p><strong>Route:</strong> {flight.departure_city} → {flight.arrival_city}</p>
        <p><strong>Price:</strong> ₹{flight.current_price ?? flight.base_price}</p>
      </div>

      <form onSubmit={handleConfirm} className="grid gap-4">
        <input placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border p-2 rounded" />
        <input placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border p-2 rounded" />
        <input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 rounded" />
        <input placeholder="Mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} className="border p-2 rounded" />

        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white py-2 rounded"
        >
          {submitting ? "Confirming..." : "Confirm Booking"}
        </button>
      </form>
    </div>
  );
}
