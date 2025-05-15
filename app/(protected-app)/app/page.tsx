import { redirect } from 'next/navigation';
import { getUser, getTeamForUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { eq } from 'drizzle-orm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Book, LockIcon, BookType, ChevronDown, ChevronRight, Brain, Code, Lightbulb, FileText, Puzzle, DollarSign, Tag, Calendar, RefreshCw, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { CollapsibleText } from './components/CollapsibleText';
import PartList from './components/PartList';

// Pobierz dane planu szkoleniowego z pliku JSON
async function getLessonPlan() {
  const filePath = path.join(process.cwd(), 'plan.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Pobierz nazwy części/rozdziałów z pliku part.json
async function getPartDetails() {
  const filePath = path.join(process.cwd(), 'part.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  
  // Przekształć tablicę w obiekt, gdzie kluczem jest id części
  const partMap: {[key: number]: {name: string, icon: string}} = {};
  data.parts.forEach((part: {id: number, name: string, icon?: string}) => {
    partMap[part.id] = {
      name: part.name,
      icon: part.icon || 'BookType' // Default icon if not specified
    };
  });
  
  return partMap;
}

// Map string icons to actual icon components
const iconMap = {
  'BookType': BookType,
  'Brain': Brain,
  'Code': Code,
  'Lightbulb': Lightbulb,
  'FileText': FileText,
  'Puzzle': Puzzle
};

// Struktura dla części kursu
interface PartInfo {
  id: number;
  name: string;
  icon: string;
  lessons: any[];
}

// Struktura do przechowywania informacji o ukończonych lekcjach
interface CompletedLesson {
  id: number;
  completedAt: string; // ISO string z datą ukończenia
}

export default async function AppPage() {
  // Get the current user
  const user = await getUser();
  if (!user) {
    redirect('/login/sign-in');
  }

  // Get the team and check subscription
  const team = await getTeamForUser(user.id);
  if (!team) {
    redirect('/dashboard');
  }

  // Check if subscription is active or in trial period
  const hasActiveSubscription = 
    team.subscriptionStatus === 'active' || 
    team.subscriptionStatus === 'trialing';
  
  if (!hasActiveSubscription) {
    redirect('/pricing?access=premium');
  }

  // Pobierz plan szkoleniowy
  const plan = await getLessonPlan();
  const lessons = plan.data;
  
  // Pobierz wartość LESSON_START z procesu środowiskowego
  const lessonStartEnv = process.env.LESSON_START;
  const lessonStart = lessonStartEnv ? parseInt(lessonStartEnv, 10) : 1;
  console.log('LESSON_START value:', lessonStart);
  
  // Określamy, które lekcje są dostępne dla użytkownika
  // Wszystkie lekcje do wartości LESSON_START są dostępne
  const availableLessonIds: number[] = [];

  // Dodaj wszystkie lekcje do LESSON_START jako dostępne
  for (let i = 1; i <= lessonStart && i <= lessons.length; i++) {
    if (!availableLessonIds.includes(i)) {
      availableLessonIds.push(i);
    }
  }

  // Dodaj następną dostępną lekcję po LESSON_START
  const nextAvailableLessonId = lessonStart + 1;
  if (nextAvailableLessonId <= lessons.length && !availableLessonIds.includes(nextAvailableLessonId)) {
    availableLessonIds.push(nextAvailableLessonId);
  }

  // Sortuj listę dostępnych lekcji
  availableLessonIds.sort((a, b) => a - b);

  // Pobierz nazwy części kursu z pliku part.json
  const partDetails = await getPartDetails();
  
  // Pobierz cookies
  const cookieStore = await cookies();
  
  // Pobierz z cookies informację o ostatnio otwartej części kursu
  const openPartCookie = cookieStore.get('openPartId');
  
  // Czytamy też ostatnio otwartą lekcję do podświetlenia
  const lastViewedLessonIdCookie = cookieStore.get('lastViewedLessonId');
  const lastViewedLessonId = lastViewedLessonIdCookie ? parseInt(lastViewedLessonIdCookie.value) : null;
  
  // Determine the part containing the last viewed lesson
  let lastViewedLessonPart = null;
  if (lastViewedLessonId !== null) {
    const lessonIndex = lastViewedLessonId - 1;
    if (lessonIndex >= 0 && lessonIndex < lessons.length) {
      lastViewedLessonPart = lessons[lessonIndex].part || 1;
    }
  }
  
  // Find the part that contains the next available lesson (marked as "Next")
  let nextLessonPart = null;
  if (nextAvailableLessonId) {
    const nextLessonIndex = nextAvailableLessonId - 1;
    if (nextLessonIndex >= 0 && nextLessonIndex < lessons.length) {
      nextLessonPart = lessons[nextLessonIndex].part || 1;
    }
  }
  
  // Determine which part to expand:
  // 1. Use the cookie value if it exists
  // 2. If no cookie but user has viewed a lesson, use that lesson's part
  // 3. Otherwise, use the part containing the next lesson
  let openPartId;
  if (openPartCookie) {
    openPartId = parseInt(openPartCookie.value);
  } else if (lastViewedLessonPart !== null) {
    openPartId = lastViewedLessonPart;
  } else if (nextLessonPart !== null) {
    openPartId = nextLessonPart;
  } else {
    openPartId = 1; // Default to first part if all else fails
  }
  
  // Grupuj lekcje według części (part)
  const parts: { [key: number]: PartInfo } = {};
  
  lessons.forEach((lesson: any, index: number) => {
    const lessonId = index + 1;
    const part = lesson.part || 1;
    
    if (!parts[part]) {
      parts[part] = {
        id: part,
        name: partDetails[part]?.name || `Część ${part}`,
        icon: partDetails[part]?.icon || 'BookType',
        lessons: []
      };
    }
    
    parts[part].lessons.push({
      ...lesson,
      lessonId
    });
  });
  
  // Sortuj części według numeru
  const sortedParts = Object.values(parts).sort((a, b) => a.id - b.id);

  return (
    <div className="flex-1 p-4 lg:p-8 max-w-3xl mx-auto w-full overflow-hidden">
      <Card className="mb-8 border-0 shadow-lg rounded-2xl overflow-hidden bg-white py-0 w-full">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-teal-500 px-6 py-6 rounded-t-2xl m-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white font-semibold flex items-center">
              AI Engineering Course
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-700 -mt-2">
            Welcome to the AI Engineering course! Below you'll find available lessons. Each one will help you understand key aspects of working as an AI Engineer.
          </p>
        </CardContent>
      </Card>

      {/* Client-side part list to preserve scroll and focus */}
      <PartList
        sortedParts={sortedParts}
        initialOpenPartId={openPartId}
        completedLessonIds={[]}
        availableLessonIds={availableLessonIds}
        nextAvailableLessonId={nextAvailableLessonId}
        lastViewedLessonId={lastViewedLessonId}
      />
    </div>
  );
} 