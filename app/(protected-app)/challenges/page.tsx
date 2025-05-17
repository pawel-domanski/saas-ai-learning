import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import fs from 'fs';
import path from 'path';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

// Interfejs dla danych wyzwania
interface Challenge {
  id: string;
  title: string;
  description: string;
  progress: string;
}

export default async function ChallengesPage() {
  // Sprawdź, czy użytkownik jest zalogowany
  const user = await getUser();
  if (!user) {
    redirect('/login/sign-in');
  }

  // Sprawdź, czy użytkownik ma aktywną subskrypcję
  const team = await getTeamForUser(user.id);
  if (!team || !(team.subscriptionStatus === 'active' || team.subscriptionStatus === 'trialing')) {
    redirect('/pricing?access=premium');
  }

  // Załaduj dane z pliku challenges.json
  const filePath = path.join(process.cwd(), 'challenges.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const { challenges } = JSON.parse(fileContents);

  const hasActiveSubscription = team.subscriptionStatus === 'active' || team.subscriptionStatus === 'trialing';

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Challenges</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge: Challenge) => (
          <Card key={challenge.id} className="shadow-lg rounded-lg overflow-hidden flex flex-col">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-teal-500 p-4">
              <CardTitle className="text-white">{challenge.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
              <p>{challenge.description}</p>
              <p className="mt-2 text-sm text-gray-500">Your progress: {challenge.progress}</p>
            </CardContent>
            {hasActiveSubscription && (
              <CardFooter className="p-4 border-t">
                <Link 
                  href={`https://aiengineer.com/challenges/${challenge.id}`}
                  target="_blank" 
                  className="flex items-center gap-2 w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 shadow-md justify-center"
                >
                  <span>Open Challenge</span>
                  <ExternalLink size={16} />
                </Link>
              </CardFooter>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
