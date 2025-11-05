import AuthGuard from '@/components/auth-guard';
import DietPlanContent from './content';

export const metadata = {
  title: 'Рацион питания | FitJourney',
};

export default function DietPlanPage() {
  return (
    <AuthGuard>
      <DietPlanContent />
    </AuthGuard>
  );
}
