import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from './login-form';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Вход | ФитПуть',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl font-headline">С возвращением!</CardTitle>
          <CardDescription>Введите свои данные для входа в аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            У вас еще нет аккаунта?{' '}
            <Button variant="link" asChild className="p-0 h-auto">
              <Link href="/register">
                Зарегистрироваться
              </Link>
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
