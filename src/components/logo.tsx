import { Dumbbell } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="FitJourney Home">
      <Dumbbell className="h-8 w-8 text-primary" />
      <span className="hidden sm:inline-block text-xl font-bold tracking-tight text-foreground font-headline">
        FitJourney
      </span>
    </Link>
  );
}
