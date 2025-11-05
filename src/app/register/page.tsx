import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RegisterForm } from './register-form';
import { Logo } from '@/components/logo';

export const metadata = {
  title: 'Регистрация | FitJourney',
};

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">Присоединяйтесь к FitJourney</CardTitle>
          <CardDescription>Создайте аккаунт, чтобы получить персональные планы</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Войти
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
