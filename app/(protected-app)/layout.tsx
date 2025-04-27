import { UserProvider } from '@/lib/auth';
import { getUser } from '@/lib/db/queries';
import { Header } from './components';
import { Suspense } from 'react';

export default async function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  const userPromise = Promise.resolve(user);

  return (
    <UserProvider userPromise={userPromise}>
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden">
        <Suspense fallback={<div className="h-12 bg-white border-b border-gray-100" />}>
          <Header user={user} />
        </Suspense>
        <main className="flex-grow flex flex-col overflow-hidden">
          <div className="w-full h-full overflow-auto max-w-full">
            {children}
          </div>
        </main>
      </div>
    </UserProvider>
  );
} 