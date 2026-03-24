// App.jsx — Main router: Admin + Student only, no instructor
import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import RootError from './components/RootError';
import ErrorBoundary from './components/ErrorBoundary';

// Auth pages (eager)
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded shared pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Courses = lazy(() => import('./pages/Courses'));
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const MyCourses = lazy(() => import('./pages/MyCourses'));
const Learning = lazy(() => import('./pages/Learning'));
const Assessments = lazy(() => import('./pages/Assessments'));
const AssessmentHistory = lazy(() => import('./pages/AssessmentHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const ManageTasks = lazy(() => import('./pages/ManageTasks'));
const AssessmentResultPage = lazy(() => import('./pages/AssessmentResultPage'));


// Admin pages
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories'));
const AdminCourses = lazy(() => import('./pages/admin/AdminCourses'));
const AdminQuizzes = lazy(() => import('./pages/admin/AdminQuizzes'));
const AITutor = lazy(() => import('./pages/AITutor'));
const TakeAssessment = lazy(() => import('./pages/TakeAssessment'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="spinner w-6 h-6 text-indigo-500" />
    </div>
  );
}

function DashPage({ children, roles, fullBleed }) {
  return (
    <ProtectedRoute roles={roles}>
      <DashboardLayout fullBleed={fullBleed}>
        <Suspense fallback={<PageLoader />}>{children}</Suspense>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<RootError />}>
      {/* ── Public ── */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* ── Shared (all authenticated roles) ── */}
      <Route path="/" element={<DashPage><Dashboard /></DashPage>} />
      <Route path="/profile" element={<DashPage><Profile /></DashPage>} />
      <Route path="/ai-tutor" element={<DashPage fullBleed><AITutor /></DashPage>} />

      {/* ── Student routes ── */}
      <Route path="/courses" element={<DashPage roles={['student']}><Courses /></DashPage>} />
      <Route path="/courses/:courseId" element={<DashPage roles={['student']}><CourseDetail /></DashPage>} />
      <Route path="/my-courses" element={<DashPage roles={['student']}><MyCourses /></DashPage>} />
      <Route path="/learn/:courseId" element={<DashPage roles={['student', 'admin']} fullBleed><Learning /></DashPage>} />
      <Route path="/assessments" element={<DashPage roles={['student']}><Assessments /></DashPage>} />
      <Route path="/assessments/take/:quizId" element={
        <ProtectedRoute roles={['student']}>
          <Suspense fallback={<PageLoader />}><TakeAssessment /></Suspense>
        </ProtectedRoute>
      } />
      <Route path="/assessment-history" element={<DashPage roles={['student']}><AssessmentHistory /></DashPage>} />
      <Route path="/assessment-result/:attemptId" element={<DashPage roles={['student']}><AssessmentResultPage /></DashPage>} />
      <Route path="/manage-tasks" element={<DashPage roles={['student']}><ManageTasks /></DashPage>} />


      {/* ── Admin routes ── */}
      <Route path="/admin/users" element={<DashPage roles={['admin']}><AdminUsers /></DashPage>} />
      <Route path="/admin/categories" element={<DashPage roles={['admin']}><AdminCategories /></DashPage>} />
      <Route path="/admin/courses" element={<DashPage roles={['admin']}><AdminCourses /></DashPage>} />
      <Route path="/admin/quizzes" element={<DashPage roles={['admin']}><AdminQuizzes /></DashPage>} />

      {/* ── Fallback ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  )
);

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
