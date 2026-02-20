import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../services/api";

/* ---------------- Alert ---------------- */

function Alert({ message, type, onClose }) {
  if (!message) return null;

  return (
    <div
      className={`p-3 rounded mb-4 flex justify-between items-center text-sm
      ${type === "success"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"}`}
    >
      <span>{message}</span>
      <button onClick={onClose}>✖</button>
    </div>
  );
}

/* ---------------- Login ---------------- */

export default function Login() {

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const [values, setValues] = useState({
    email: "",
    password: ""
  });

  const [alert, setAlert] = useState({
    message: "",
    type: "success"
  });

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", values);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/dashboard");

    } catch (error) {
      setAlert({
        message: error.response?.data?.message || "Invalid email or password",
        type: "error"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f7fb] px-4">

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">

        <Alert
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ message: "", type: "success" })}
        />

        <h1 className="text-3xl font-bold text-center text-gray-800">
          Sign In
        </h1>

        <p className="text-center text-gray-500 mb-8">
          Access your learning dashboard
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2">
            <MdEmail className="text-blue-600 mr-2" />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={values.email}
              onChange={handleChange}
              required
              className="bg-transparent w-full outline-none"
            />
          </div>

          {/* Password */}
          <div className="flex items-center bg-gray-100 rounded-lg px-4 py-2 relative">
            <RiLockPasswordLine className="text-blue-600 mr-2" />

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={values.password}
              onChange={handleChange}
              required
              className="bg-transparent w-full outline-none pr-8"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gray-600"
            >
              {showPassword ? <FaEye /> : <FaEyeSlash />}
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Sign In
          </button>

          {/* Register */}
          <p className="text-center text-gray-600 mt-4">
            Don’t have an account?{" "}
            <span
              onClick={() => navigate("/register")}
              className="text-blue-600 cursor-pointer font-semibold"
            >
              Register
            </span>
          </p>

        </form>

      </div>
    </div>
  );
}
