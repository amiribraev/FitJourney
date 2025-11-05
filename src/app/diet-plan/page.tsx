import AuthGuard from '@/components/auth-guard';
import DietPlanContent from './content';

export const metadata = {
  title: 'Рацион | ФитПуть',
};

export default function DietPlanPage() {
  return (
    <AuthGuard>
      <DietPlanContent />
    </AuthGuard>
  );
}
