import { useParams } from 'react-router-dom';
import { ProfileView } from '../components/profile/ProfileView';

export default function EmployeeProfilePage() {
  const { id } = useParams();
  return <ProfileView employeeId={id} showBackLink />;
}
