import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Index";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./auth/AuthContext";
import History from "./pages/History";
import Booking from "./pages/Booking";
import BookingConfirmation from "./pages/BookingConfirmation";


function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
        path="/history"
        element={
        <PrivateRoute>
          <History />
          </PrivateRoute>
        }
        />
        <Route path="/book/:flightId" element={<Booking />} />
        <Route path="/booking-confirmation" element={<BookingConfirmation />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
