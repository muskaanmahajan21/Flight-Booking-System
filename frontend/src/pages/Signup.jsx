import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    dob: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone: allow only numbers
    if (name === "phone" && !/^\d*$/.test(value)) return;

    setForm({ ...form, [name]: value });
  };

  const validateEmail = (email) => {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email);
  };

  const validatePassword = (password) => {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const { username, email, dob, phone, password, confirmPassword } = form;

    if (!username || !email || !dob || !phone || !password || !confirmPassword) {
      return setError("All fields are mandatory");
    }

    if (username.length < 3) {
      return setError("Username must be at least 3 characters");
    }

    if (!validateEmail(email)) {
      return setError("Only valid Gmail addresses are allowed");
    }

    if (phone.length !== 10) {
      return setError("Phone number must be exactly 10 digits");
    }

    const age = calculateAge(dob);
    if (age < 18) {
      return setError("You must be at least 18 years old");
    }

    if (!validatePassword(password)) {
      return setError(
        "Password must be 8+ chars, include uppercase, number & symbol"
      );
    }

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }

    // 🔐 Check if email already exists
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const emailExists = users.some((u) => u.email === email);

    if (emailExists) {
      return setError("Email already exists");
    }

    // Save new user
    users.push({ username, email, dob, phone });
    localStorage.setItem("users", JSON.stringify(users));

    navigate("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 px-4">
      <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6">

        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-sky-500 flex items-center justify-center text-white text-3xl shadow-lg">
            ✈
          </div>
          <h1 className="text-2xl font-bold mt-4">Create Account</h1>
          <p className="text-sm text-gray-500">Join SkyWing today</p>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-3">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-sky-500"
            required
          />

          <input
            name="email"
            placeholder="Email (gmail only)"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-sky-500"
            required
          />

          <input
            name="dob"
            type="date"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-sky-500"
            required
          />

          <input
            name="phone"
            placeholder="Phone Number"
            maxLength={10}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-sky-500"
            required
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-sky-500"
            required
          />

          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm Password"
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-sky-500"
            required
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-sky-500 text-white font-semibold hover:bg-sky-600 transition"
          >
            Sign up
          </button>
        </form>

        <p className="text-center text-sm mt-5">
          Already have an account?{" "}
          <Link to="/" className="text-sky-500 font-semibold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
