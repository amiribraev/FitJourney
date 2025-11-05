import AuthGuard from '@/components/auth-guard';
import ProfileContent from './content';

export const metadata = {
  title: 'Мой профиль | ФитПуть',
};

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
