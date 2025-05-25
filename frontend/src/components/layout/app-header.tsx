'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggleButton } from '@/components/theme/theme-toggle-button';

export function AppHeader() {
  const { theme, resolvedTheme } = useTheme();
  const currentTheme = resolvedTheme || theme;

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 shadow-sm">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <Link href="/inbox" className="flex items-center gap-2 text-lg font-semibold md:text-base text-foreground hover:text-primary transition-colors">
        <img 
          src={currentTheme === 'dark' ? '/logo-white.png' : '/logo.png'}
          alt="MuninMail Logo" 
          width={24} 
          height={24} 
          className="h-6 w-6"
        />
        <span className="sr-only sm:not-sr-only">MuninMail</span>
      </Link>

      <div className="ml-auto flex items-center gap-2">
        <ThemeToggleButton />
        {/* Add User Menu or other header items here if needed */}
      </div>
    </header>
  );
}
