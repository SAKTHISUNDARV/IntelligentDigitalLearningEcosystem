import { createBrowserRouter, RouterProvider, createRoutesFromElements, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import RootError from './components/RootError';
import ErrorBoundary from './components/ErrorBoundary';

const Landing = lazy(() => import('./pages/Landing'));
import Login from './pages/Login';
import Register from './pages/Register';

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
const SearchResults = lazy(() => import('./pages/SearchResults'));
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

function Page(element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route errorElement={<RootError />}>
      <Route path="/" element={Page(<Landing />)} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={Page(<Dashboard />)} />
          <Route path="/profile" element={Page(<Profile />)} />
          <Route path="/search" element={Page(<SearchResults />)} />

          <Route element={<ProtectedRoute roles={['student']} />}>
            <Route path="/courses" element={Page(<Courses />)} />
            <Route path="/courses/:courseId" element={Page(<CourseDetail />)} />
            <Route path="/my-courses" element={Page(<MyCourses />)} />
            <Route path="/assessments" element={Page(<Assessments />)} />
            <Route path="/assessment-history" element={Page(<AssessmentHistory />)} />
            <Route path="/assessment-result/:attemptId" element={Page(<AssessmentResultPage />)} />
            <Route path="/manage-tasks" element={Page(<ManageTasks />)} />
          </Route>

          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route path="/admin/users" element={Page(<AdminUsers />)} />
            <Route path="/admin/categories" element={Page(<AdminCategories />)} />
            <Route path="/admin/courses" element={Page(<AdminCourses />)} />
            <Route path="/admin/quizzes" element={Page(<AdminQuizzes />)} />
          </Route>
        </Route>

        <Route element={<DashboardLayout fullBleed />}>
          <Route path="/ai-tutor" element={Page(<AITutor />)} />

          <Route element={<ProtectedRoute roles={['student', 'admin']} />}>
            <Route path="/learn/:courseId" element={Page(<Learning />)} />
          </Route>
        </Route>
      </Route>

      <Route
        path="/assessments/take/:quizId"
        element={
          <ProtectedRoute roles={['student']}>
            {Page(<TakeAssessment />)}
          </ProtectedRoute>
        }
      />

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
