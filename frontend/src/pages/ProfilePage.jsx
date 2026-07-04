import { useAuth } from '../context/AuthContext';
import { ProfileView } from '../components/profile/ProfileView';

export default function ProfilePage() {
  const { user } = useAuth();
  return <ProfileView employeeId={user.id} />;
}
