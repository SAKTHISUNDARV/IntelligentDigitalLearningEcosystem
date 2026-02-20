import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard.jsx";
import Courses from "./pages/Courses.jsx";
import MyCourses from "./pages/MyCourses.jsx";
import Assessments from "./pages/Assesments.jsx";
import AssessmentHistory from "./pages/AssesmentHistory.jsx";
import Profile from "./pages/Profile.jsx";

import DashboardLayout from "./components/DashboardLayout.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          }
        />

        <Route path="/courses" element={<DashboardLayout><Courses /></DashboardLayout>} />
        <Route path="/my-courses" element={<DashboardLayout><MyCourses /></DashboardLayout>} />
        <Route path="/assessments" element={<DashboardLayout><Assessments /></DashboardLayout>} />
        <Route path="/assessment-history" element={<DashboardLayout><AssessmentHistory /></DashboardLayout>} />
        <Route path="/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />

      </Routes>
    </BrowserRouter>
  );
}
