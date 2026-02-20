import { useNavigate } from "react-router-dom";

export default function Home() {

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f5f7fb] flex flex-col">

      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-white shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600">
          Intelligent Digital Learning Ecosystem
        </h1>

        <button
          onClick={() => navigate("/login")}
          className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700"
        >
          Login
        </button>
      </nav>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6">

        <h2 className="text-5xl font-extrabold text-gray-800 mb-4">
          Learn Smarter with AI
        </h2>

        <p className="text-gray-600 max-w-2xl text-lg mb-8">
          Personalized learning paths, intelligent recommendations, 
          and real-time progress tracking — all in one platform.
        </p>

        <div className="space-x-4">
          <button
            onClick={() => navigate("/register")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Get Started
          </button>

          <button
            onClick={() => navigate("/login")}
            className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-50"
          >
            Sign In
          </button>
        </div>

      </div>

    </div>
  );
}
