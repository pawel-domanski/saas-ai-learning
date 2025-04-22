'use client';

import Link from 'next/link';
import { use, useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { CircleIcon, Home, LogOut } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/lib/auth';
import { signOut } from '@/app/(login)/actions';
import { useRouter } from 'next/navigation';

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userPromise } = useUser();
  const user = use(userPromise);
  const router = useRouter();

  const getUserInitials = (user: { name?: string | null; email: string }) => {
    if (user.name) {
      return user.name
        .split(' ')
        .map((n) => n[0])
        .join('');
    }
    return user.email[0].toUpperCase();
  };

  async function handleSignOut() {
    await signOut();
    router.refresh();
    router.push('/');
  }

  if (!user) {
    return (
      <>
        <Link
          href="/pricing"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Pricing
        </Link>
        <Button asChild className="rounded-full bg-gradient-to-r from-blue-600 to-teal-500 hover:from-blue-700 hover:to-teal-600 text-white shadow-sm">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9 border-2 border-white shadow-sm">
          <AvatarImage alt={user.name || ''} />
          <AvatarFallback className="bg-gradient-to-r from-blue-100 to-teal-100 text-teal-800 font-medium">
            {getUserInitials(user)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1 p-2 shadow-lg rounded-xl border border-gray-100">
        <DropdownMenuItem className="cursor-pointer rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50">
          <Link href="/dashboard" className="flex w-full items-center py-1">
            <Home className="mr-2 h-4 w-4 text-teal-500" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer rounded-lg hover:bg-gradient-to-r hover:from-blue-50 hover:to-green-50">
              <LogOut className="mr-2 h-4 w-4 text-teal-500" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <Link href="/" className="flex items-center">
          <img src="/Logo_all.svg" alt="Focus your AI logo" className="h-8 w-auto" />
          <span className="ml-2 text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-teal-500">Focus your AI</span>
        </Link>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <section className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <Header />
      {children}
    </section>
  );
}
