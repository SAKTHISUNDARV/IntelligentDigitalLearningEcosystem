import { Link, useLocation } from "react-router-dom";

import {
  MdDashboard,
  MdMenuBook,
  MdLibraryBooks,
  MdAssignment,
  MdHistory,
  MdPerson,
  MdLogout
} from "react-icons/md";

export default function Sidebar() {

  const location = useLocation();

  const linkStyle = (path) => {
    const isActive = location.pathname === path;

    return `
      flex items-center gap-3 px-4 py-2 rounded-lg transition relative
      ${isActive
        ? "bg-[#24a0ed]/10 text-[#24a0ed] font-semibold"
        : "text-gray-700 hover:bg-[#24a0ed]/10 hover:text-[#24a0ed]"
      }
    `;
  };

  const activeBar = (path) =>
    location.pathname === path && (
      <span className="absolute left-0 top-0 h-full w-1 bg-[#24a0ed] rounded-r"></span>
    );

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-200 p-5 flex flex-col">

      {/* Logo */}
      <h2 className="text-2xl font-bold mb-10 text-center text-[#24a0ed]">
        IDLE
      </h2>

      {/* Dashboard */}
      <div className="mb-8 relative">
        <Link to="/" className={linkStyle("/")}>
          {activeBar("/")}
          <MdDashboard size={20} />
          Dashboard
        </Link>
      </div>

      {/* Learning */}
      <div className="mb-8">
        <p className="text-gray-400 text-xs uppercase mb-3 tracking-wider">
          Learning
        </p>

        <ul className="space-y-2">

          <li className="relative">
            <Link to="/courses" className={linkStyle("/courses")}>
              {activeBar("/courses")}
              <MdMenuBook size={20} />
              Available Courses
            </Link>
          </li>

          <li className="relative">
            <Link to="/my-courses" className={linkStyle("/my-courses")}>
              {activeBar("/my-courses")}
              <MdLibraryBooks size={20} />
              Registered Courses
            </Link>
          </li>

        </ul>
      </div>

      {/* Assessments */}
      <div className="mb-8">
        <p className="text-gray-400 text-xs uppercase mb-3 tracking-wider">
          Assessments
        </p>

        <ul className="space-y-2">

          <li className="relative">
            <Link to="/assessments" className={linkStyle("/assessments")}>
              {activeBar("/assessments")}
              <MdAssignment size={20} />
              Take Assessment
            </Link>
          </li>

          <li className="relative">
            <Link
              to="/assessment-history"
              className={linkStyle("/assessment-history")}
            >
              {activeBar("/assessment-history")}
              <MdHistory size={20} />
              Assessment History
            </Link>
          </li>

        </ul>
      </div>

      {/* Account */}
      <div className="mt-auto">
        <p className="text-gray-400 text-xs uppercase mb-3 tracking-wider">
          Account
        </p>

        <ul className="space-y-2">

          <li className="relative">
            <Link to="/profile" className={linkStyle("/profile")}>
              {activeBar("/profile")}
              <MdPerson size={20} />
              Profile
            </Link>
          </li>

          <li>
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-2 rounded-lg
                         text-gray-700 hover:bg-red-50 hover:text-red-600 transition"
            >
              <MdLogout size={20} />
              Logout
            </Link>
          </li>

        </ul>
      </div>

    </div>
  );
}
