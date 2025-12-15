import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!email || !password) {
      setLoading(false);
      return setError("Please fill all fields");
    }

    try {
      await login(email, password);
      navigate("/dashboard"); 
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6">

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center text-white text-3xl shadow-lg">
            ✈
          </div>
          <h1 className="text-2xl font-bold mt-4">SkyWing</h1>
          <p className="text-sm text-gray-500">
            Seamless Flight Booking
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 transition"
          >
            {loading ? "LOADING..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm mt-5">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-sky-500 font-semibold">
            Create new account
          </Link>
        </p>
      </div>
    </div>
  );
}
