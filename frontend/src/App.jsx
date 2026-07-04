import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './components/RequireAuth';
import { RedirectIfAuthenticated } from './components/RedirectIfAuthenticated';
import { AppShell } from './components/layout/AppShell';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ChangePassword from './pages/ChangePassword';
import EmployeesPage from './pages/EmployeesPage';
import EmployeeProfilePage from './pages/EmployeeProfilePage';
import AttendancePage from './pages/AttendancePage';
import TimeOffPage from './pages/TimeOffPage';
import ProfilePage from './pages/ProfilePage';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Routes>
      {/* Public auth routes - bounce back to the app if already signed in */}
      <Route element={<RedirectIfAuthenticated />}>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
      </Route>

      {/* Everything below requires a session. RequireAuth also redirects to
          /change-password if the user still has mustChangePassword set. */}
      <Route element={<RequireAuth />}>
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/employees" replace />} />
          <Route path="/employees" element={<EmployeesPage />} />
          <Route path="/employees/:id" element={<EmployeeProfilePage />} />
          <Route path="/attendance" element={<AttendancePage />} />
          <Route path="/time-off" element={<TimeOffPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route path="/not-found" element={<NotFound />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
