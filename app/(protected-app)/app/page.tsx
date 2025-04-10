import { redirect } from 'next/navigation';
import { getUser, getTeamForUser, getAllUserProgress } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { CheckCircle, LockIcon, BookType, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';
import { CookieDebug } from './cookie-debug';

// Pobierz dane planu szkoleniowego z pliku JSON
async function getLessonPlan() {
  const filePath = path.join(process.cwd(), 'plan.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(fileContents);
}

// Pobierz nazwy części/rozdziałów z pliku part.json
async function getPartNames() {
  const filePath = path.join(process.cwd(), 'part.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContents);
  
  // Przekształć tablicę w obiekt, gdzie kluczem jest id części
  const partMap: {[key: number]: string} = {};
  data.parts.forEach((part: {id: number, name: string}) => {
    partMap[part.id] = part.name;
  });
  
  return partMap;
}

// Struktura dla części kursu
interface PartInfo {
  id: number;
  name: string;
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
    redirect('/sign-in');
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

  // Próbujemy pobrać postęp użytkownika - zamiast z bazy danych, z ciasteczka
  let completedLessonIds: number[] = [];
  let completedLessons = 0;
  let percentComplete = 0;
  let completedLessonsWithDates: CompletedLesson[] = [];
  let canCompleteToday = true;

  // Pobierz z cookies informacje o ukończonych lekcjach
  const cookieStore = await cookies();
  const completedLessonsCookie = cookieStore.get('completedLessons')?.value;
  
  console.log('Server-side completedLessons cookie (main page):', completedLessonsCookie);

  if (completedLessonsCookie) {
    try {
      // Upewnij się, że ciasteczko jest poprawnie parsowane
      const parsed = JSON.parse(completedLessonsCookie);
      console.log('Parsed completedLessonIds (main page):', parsed);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (typeof parsed[0] === 'object' && parsed[0].hasOwnProperty('id')) {
          // Nowy format z datami
          completedLessonsWithDates = parsed;
          completedLessonIds = parsed.map(item => item.id);
        } else {
          // Stary format - tylko id
          completedLessonIds = parsed;
          // Konwertuj do nowego formatu
          completedLessonsWithDates = parsed.map(id => ({
            id,
            completedAt: new Date().toISOString()
          }));
        }
        
        // Sprawdź, czy można ukończyć lekcję dzisiaj
        if (completedLessonsWithDates.length > 0) {
          // Sortuj według daty ukończenia (od najnowszej)
          const sortedLessons = [...completedLessonsWithDates].sort((a, b) => 
            new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
          );
          
          const lastCompletedLesson = sortedLessons[0];
          const lastCompletedDate = new Date(lastCompletedLesson.completedAt);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0); // Początek dzisiejszego dnia
          
          const lastDate = new Date(lastCompletedDate);
          lastDate.setHours(0, 0, 0, 0); // Początek dnia ukończenia
          
          // Sprawdź, czy ostatnia lekcja została ukończona dzisiaj
          if (lastDate.getTime() === today.getTime()) {
            canCompleteToday = false;
          }
        }
        
        completedLessons = completedLessonIds.length;
        percentComplete = Math.round((completedLessons / lessons.length) * 100);
      } else {
        // Pusta tablica
        console.log('Empty completedLessons array');
      }
    } catch (error) {
      console.log('Error parsing completedLessons cookie:', error);
      // Jeśli wystąpi błąd, używamy wartości domyślnych
    }
  } else {
    console.log('No completedLessons cookie found (main page)');
  }

  // Określamy, które lekcje są dostępne dla użytkownika
  // Ukończone lekcje są zawsze dostępne
  // Dodatkowo dostępna jest pierwsza nieukończona lekcja
  const availableLessonIds: number[] = [...completedLessonIds];
  let nextAvailableLessonId = 1;

  // Znajdź pierwszą nieukończoną lekcję
  for (let i = 0; i < lessons.length; i++) {
    const lessonId = i + 1;
    if (!completedLessonIds.includes(lessonId)) {
      nextAvailableLessonId = lessonId;
      break;
    }
  }

  // Dodaj następną dostępną lekcję do listy dostępnych
  if (!availableLessonIds.includes(nextAvailableLessonId)) {
    availableLessonIds.push(nextAvailableLessonId);
  }

  // Sortuj listę dostępnych lekcji
  availableLessonIds.sort((a, b) => a - b);

  // Pobierz nazwy części kursu z pliku part.json
  const partNames = await getPartNames();
  
  // Pobierz z cookies informację o ostatnio otwartej części kursu
  const openPartCookie = cookieStore.get('openPartId');
  const openPartId = openPartCookie ? parseInt(openPartCookie.value) : 1;
  
  // Czytamy też ostatnio otwartą lekcję do podświetlenia
  const lastViewedLessonIdCookie = cookieStore.get('lastViewedLessonId');
  const lastViewedLessonId = lastViewedLessonIdCookie ? parseInt(lastViewedLessonIdCookie.value) : 1;
  
  // Grupuj lekcje według części (part)
  const parts: { [key: number]: PartInfo } = {};
  
  lessons.forEach((lesson, index) => {
    const lessonId = index + 1;
    const part = lesson.part || 1;
    
    if (!parts[part]) {
      parts[part] = {
        id: part,
        name: partNames[part] || `Część ${part}`,
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
    <div className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto">
      <Card className="mb-8 border-0 shadow-lg rounded-2xl overflow-hidden bg-white py-0">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-teal-500 px-6 py-6 rounded-t-2xl m-0">
          <div className="flex justify-between items-center">
            <CardTitle className="text-white font-semibold flex items-center">
              AI Engineering Course
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-700">
            Welcome to the AI Engineering course! Below you'll find available lessons. Each one will help you understand key aspects of working as an AI Engineer.
          </p>
        </CardContent>
      </Card>

      {sortedParts.map((part) => {
        // Sprawdź, czy ta część ma być rozwinięta
        const isOpen = part.id === openPartId;
        
        return (
          <div key={part.id} className="mb-6 border border-gray-100 rounded-lg overflow-hidden shadow-sm">
            <form action={`/api/toggle-part?partId=${part.id}`} method="POST">
              <Button 
                variant="ghost" 
                className={`w-full flex justify-between items-center p-4 text-left ${isOpen ? 'bg-blue-50' : 'bg-white'}`}
                type="submit"
              >
                <div className="flex items-center">
                  <BookType className="mr-2 text-blue-600" size={20} />
                  <h2 className="text-xl font-bold text-blue-600">{part.name}</h2>
                </div>
                {isOpen ? (
                  <ChevronDown className="text-blue-600" size={20} />
                ) : (
                  <ChevronRight className="text-blue-600" size={20} />
                )}
              </Button>
            </form>
            
            {isOpen && (
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50">
                {part.lessons.map((lesson) => {
                  const lessonId = lesson.lessonId;
                  const isCompleted = completedLessonIds.includes(lessonId);
                  const isAvailable = availableLessonIds.includes(lessonId);
                  const isNextLesson = lessonId === nextAvailableLessonId;
                  const isCurrentLesson = lessonId === lastViewedLessonId;
                  
                  const cardContent = (
                    <div 
                      className={`bg-white rounded-lg shadow p-4 border border-l-4
                      ${isCompleted ? 'border-teal-200 border-l-teal-500' : 
                        isNextLesson ? 'border-blue-200 border-l-blue-500' : 'border-gray-200'} 
                      ${isCurrentLesson ? 'ring-2 ring-blue-100' : ''}
                      transition-all duration-200 
                      ${isAvailable ? 'hover:shadow-md cursor-pointer' : 'opacity-70'}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-white font-semibold mr-3 
                            ${isNextLesson ? 'bg-blue-500' : 'bg-gradient-to-r from-blue-500 to-teal-500'}`}>
                            {lessonId}
                          </div>
                          <h2 className={`font-semibold 
                            ${isCompleted ? 'text-teal-700' : 
                              isNextLesson ? 'text-blue-700' : 
                              isAvailable ? 'text-gray-800' : 'text-gray-400'} 
                            ${isCurrentLesson ? 'underline' : ''}`}>
                            {lesson.subject}
                          </h2>
                        </div>
                        {isCompleted ? (
                          <div className="flex items-center text-teal-600 text-xs font-medium ml-2">
                            <CheckCircle size={16} />
                          </div>
                        ) : isNextLesson ? (
                          <div className="flex items-center text-blue-600 text-xs font-medium ml-2 bg-blue-50 px-2 py-1 rounded">
                            Next
                          </div>
                        ) : !isAvailable ? (
                          <div className="flex items-center text-gray-400 text-xs font-medium ml-2">
                            <LockIcon size={16} />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                  
                  return isAvailable ? (
                    <Link key={lessonId} href={`/app/lessons/${lessonId}`}>
                      {cardContent}
                    </Link>
                  ) : (
                    <div key={lessonId}>{cardContent}</div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Debug info */}
      <div className="mt-8">
        <CookieDebug />
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-sm font-bold mb-2">Server debug (main page):</h3>
          <pre className="text-xs overflow-auto max-h-32">
            completedLessonsCookie: {completedLessonsCookie || 'none'}
            completedLessonIds: {JSON.stringify(completedLessonIds)}
            completedLessons: {completedLessons}
            percentComplete: {percentComplete}
          </pre>
        </div>
      </div>
    </div>
  );
} 