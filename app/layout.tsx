import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Modern SaaS Platform',
  description: 'A next-generation SaaS platform with modern UI and powerful features.',
};

export const viewport: Viewport = {
  maximumScale: 1,
};

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap', // Ensure text is visible during load
  variable: '--font-inter', // Assign variable to be used in CSS
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userPromise = getUser();

  return (
    <html
      lang="en"
      className={inter.variable} // Only apply the font variable to HTML
      suppressHydrationWarning
    >
      <body 
        className="min-h-[100dvh] antialiased bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950" 
        suppressHydrationWarning
      >
        <UserProvider userPromise={userPromise}>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
