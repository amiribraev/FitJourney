import AuthGuard from '@/components/auth-guard';
import WorkoutPlanContent from './content';

export const metadata = {
  title: 'Тренировки | ФитПуть',
};

export default function WorkoutPlanPage() {
  return (
    <AuthGuard>
      <WorkoutPlanContent />
    </AuthGuard>
  );
}
