'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dumbbell,
  Home,
  User,
  LogIn,
  LogOut,
  Menu,
  UtensilsCrossed,
  HeartPulse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUser, useAuth as useFirebaseAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { Logo } from './logo';


const navLinks = [
  { href: '/', label: 'Главная', icon: Home },
  {
    href: '/diet-plan',
    label: 'Рацион',
    icon: UtensilsCrossed,
    auth: true,
  },
  {
    href: '/workout-plan',
    label: 'Тренировки',
    icon: HeartPulse,
    auth: true,
  },
];

export function Header() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useFirebaseAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // This is a client-side function, so we can safely use window.location
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };


  const renderNavLinks = (isMobile = false) =>
    navLinks.map((link) => {
      if (link.auth && !user) return null;
      return (
        <Button
          key={link.href}
          variant="ghost"
          asChild
          className={cn(
            'justify-start',
            pathname === link.href
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <Link href={link.href}>
            <link.icon className="mr-2 h-4 w-4" />
            {link.label}
          </Link>
        </Button>
      );
    });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Logo />
          <nav className="hidden items-center gap-4 md:flex">
            {renderNavLinks()}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex">
            {!isUserLoading &&
              (user ? (
                <UserMenu onSignOut={handleSignOut} />
              ) : (
                <Button asChild>
                  <Link href="/login">Войти</Link>
                </Button>
              ))}
          </div>
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Открыть меню</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="mt-8 flex flex-col gap-4">
                  {renderNavLinks(true)}
                  <DropdownMenuSeparator />
                  {!isUserLoading &&
                    (user ? (
                      <>
                        <Button variant="ghost" asChild className="justify-start">
                          <Link href="/profile">
                            <User className="mr-2 h-4 w-4" />
                            Мой профиль
                          </Link>
                        </Button>
                        <Button variant="ghost" onClick={handleSignOut} className="justify-start">
                          <LogOut className="mr-2 h-4 w-4" />
                          Выйти
                        </Button>
                      </>
                    ) : (
                      <Button asChild>
                        <Link href="/login">Войти</Link>
                      </Button>
                    ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
          <span className="sr-only">Меню пользователя</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            <span>Мой профиль</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Выйти</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
