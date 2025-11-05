import AuthGuard from '@/components/auth-guard';
import ProgressContent from './content';

export const metadata = {
  title: 'Мой Прогресс | ФитПуть',
};

export default function ProgressPage() {
  return (
    <AuthGuard>
      <ProgressContent />
    </AuthGuard>
  );
}
