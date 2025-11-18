import { BrowserRouter as Router, Routes, Route, } from "react-router";
import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";
import NotAuthorized from "./pages/OtherPage/NotAuthorized";
import UserProfiles from "./pages/UserProfiles";
import Calendar from "./pages/Calendar";

import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import TeacherDashboard from "./pages/Dashboard/TeacherDashboard";
import StudentDashboard from "./pages/Dashboard/StudentDashboard";
import StudentClasses from "./pages/Student/StudentClasses";
import StudentSubjects from "./pages/Student/StudentSubjects";
import StudentAssignments from "./pages/Student/StudentAssignments";
import TeacherClasses from "./pages/Teacher/TeacherClasses";
import TeacherSubjects from "./pages/Teacher/TeacherSubjects";
import TeacherAssignments from "./pages/Teacher/TeacherAssignments";
import CoursesAdmin from "./pages/Admin/CoursesAdmin";
import UsersAdmin from "./pages/Admin/UsersAdmin";
import RolesAdmin from "./pages/Admin/RolesAdmin";
import EnrollmentsAdmin from "./pages/Admin/EnrollmentsAdmin";
import GradeItemsAdmin from "./pages/Admin/GradeItemsAdmin";
import StudentGradesAdmin from "./pages/Admin/StudentGradesAdmin";
import SubmissionFilesAdmin from "./pages/Admin/SubmissionFilesAdmin";
import ProtectedRoute from './components/auth/ProtectedRoute';
import useAuthStore from './stores/useAuthStore';
import { ToastContainer } from "react-toastify";

export default function App() {
  const { user } = useAuthStore();

  const renderRoleRoutes = () => {
    if (!user) return null;

      switch (user.roleName) {
      case 'ADMIN':
        return (
          <>
            <Route index element={<AdminDashboard />} />
            <Route path="admin/courses" element={<CoursesAdmin />} />
            <Route path="admin/users" element={<UsersAdmin />} />
            <Route path="admin/roles" element={<RolesAdmin />} />
            <Route path="admin/enrollments" element={<EnrollmentsAdmin />} />
            <Route path="admin/grade-items" element={<GradeItemsAdmin />} />
            <Route path="admin/student-grades" element={<StudentGradesAdmin />} />
            <Route path="admin/submission-files" element={<SubmissionFilesAdmin />} />
            <Route path="/profile" element={<UserProfiles />} />
          </>
        );

      case 'TEACHER':
        return (
          <>
            <Route index element={<TeacherDashboard />} />
            <Route path="teacher/classes" element={<TeacherClasses />} />
            <Route path="teacher/subjects" element={<TeacherSubjects />} />
            <Route path="teacher/assignments" element={<TeacherAssignments />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
          </>
        );

      case 'STUDENT':
        return (
          <>
            <Route index element={<StudentDashboard />} />
            <Route path="/profile" element={<UserProfiles />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="student/classes" element={<StudentClasses />} />
            <Route path="student/subjects" element={<StudentSubjects />} />
            <Route path="student/assignments" element={<StudentAssignments />} />
          </>
        );

      default:
        return <Route path="*" element={<NotAuthorized />} />;
    }
  };

  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* Auth Pages */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected Dashboard */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          {renderRoleRoutes()}
        </Route>

        {/* Not Authorized */}
        <Route path="/not-authorized" element={<NotAuthorized />} />

        {/* Fallback */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer position="top-right" className="absolute top-30 right-10" autoClose={3000} />
    </Router>
  );
}
