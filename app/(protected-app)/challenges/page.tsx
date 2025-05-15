import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import fs from 'fs';
import path from 'path';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Challenges</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {challenges.map((challenge) => (
          <Card key={challenge.id} className="shadow-lg rounded-lg overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-teal-500 p-4">
              <CardTitle className="text-white">{challenge.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p>{challenge.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
