import React, { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/dashboard")) {
      const user = localStorage.getItem("user");
      if (!user) {
        navigate("/login", { replace: true });
      }
    }
  }, [location, navigate]);

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="text-xl font-bold">TicketMaster</div>
        <div className="space-x-4">
          <Link to="/dashboard" className="hover:text-blue-200">
            Dashboard
          </Link>
          <Link to="/login" className="hover:text-blue-200">
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
