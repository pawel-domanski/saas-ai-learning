import { redirect } from 'next/navigation';
import { getUser, getTeamForUser, getAllUserProgress } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Book, LockIcon, BookType, ChevronDown, ChevronRight, Brain, Code, Lightbulb, FileText, Puzzle } from 'lucide-react';
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
      // Upewnij się, że ciasteczko jest poprawnie parsowane - najpierw zdekoduj URI
      const decodedCookie = decodeURIComponent(completedLessonsCookie);
      const parsed = JSON.parse(decodedCookie);
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
  // 1. Ukończone lekcje są zawsze dostępne
  // 2. Lekcje do wartości LESSON_START są od razu dostępne
  // 3. Dodatkowo dostępna jest pierwsza nieukończona lekcja po LESSON_START
  const availableLessonIds: number[] = [...completedLessonIds];
  let nextAvailableLessonId = 1;

  // Pobierz wartość LESSON_START z procesu środowiskowego
  const lessonStartEnv = process.env.LESSON_START;
  const lessonStart = lessonStartEnv ? parseInt(lessonStartEnv, 10) : 1;
  console.log('LESSON_START value:', lessonStart);

  // Dodaj wszystkie lekcje do LESSON_START jako dostępne
  for (let i = 1; i <= lessonStart && i <= lessons.length; i++) {
    if (!availableLessonIds.includes(i)) {
      availableLessonIds.push(i);
    }
  }

  // Znajdź pierwszą nieukończoną lekcję po LESSON_START
  for (let i = 0; i < lessons.length; i++) {
    const lessonId = i + 1;
    if (lessonId > lessonStart && !completedLessonIds.includes(lessonId)) {
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
  const partDetails = await getPartDetails();
  
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

      <div className="space-y-6 mb-8">
        {sortedParts.map((part) => {
          // Sprawdź, czy ta część ma być rozwinięta
          const isOpen = part.id === openPartId;
          
          // Get the correct icon component
          const IconComponent = iconMap[part.icon as keyof typeof iconMap] || BookType;
          
          return (
            <div key={part.id} className="rounded-lg overflow-hidden shadow-md border border-gray-200">
              <form action={`/api/toggle-part?partId=${part.id}`} method="POST">
                <button 
                  type="submit"
                  className={`block w-full relative p-0 text-left ${isOpen ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mr-4">
                        <IconComponent className="text-white" size={24} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-semibold text-blue-700 truncate">{part.name}</h2>
                        <p className="text-sm text-blue-500">{part.lessons.length} lessons</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {isOpen ? (
                        <div className="p-2 rounded-full bg-blue-100">
                          <ChevronDown className="text-blue-700" size={20} />
                        </div>
                      ) : (
                        <div className="p-2 rounded-full bg-gray-100">
                          <ChevronRight className="text-blue-600" size={20} />
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              </form>
              
              {isOpen && (
                <div className="border-t border-blue-100 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                    {part.lessons.map((lesson) => {
                      const lessonId = lesson.lessonId;
                      const isCompleted = completedLessonIds.includes(lessonId);
                      const isAvailable = availableLessonIds.includes(lessonId);
                      const isNextLesson = lessonId === nextAvailableLessonId;
                      const isCurrentLesson = lessonId === lastViewedLessonId;
                      
                      const cardContent = (
                        <div 
                          className={`bg-white rounded-lg shadow h-full border-l-4
                          ${isCompleted ? 'border-l-teal-500' : 
                            isNextLesson ? 'border-l-blue-500' : 'border-l-gray-200'} 
                          border border-gray-200
                          ${isCurrentLesson ? 'ring-2 ring-blue-100' : ''}
                          transition-all duration-200 
                          ${isAvailable ? 'hover:shadow-md cursor-pointer' : 'opacity-70'}`}
                        >
                          <div className="p-3 h-full flex flex-col">
                            <div className="flex items-start">
                              <div className={`h-6 w-6 rounded-full flex items-center justify-center text-white font-semibold mr-2 flex-shrink-0
                                ${isNextLesson ? 'bg-blue-500' : 'bg-gradient-to-r from-blue-500 to-teal-500'}`}>
                                {lessonId}
                              </div>
                              <h3 className={`font-medium text-sm truncate
                                ${isCompleted ? 'text-teal-700' : 
                                  isNextLesson ? 'text-blue-700' : 
                                  isAvailable ? 'text-gray-800' : 'text-gray-400'}`}>
                                {lesson.subject}
                              </h3>
                            </div>
                            
                            <div className="mt-auto pt-2">
                              {isCompleted ? (
                                <div className="flex items-center text-teal-600 text-xs">
                                  <Book size={12} className="mr-1 flex-shrink-0" />
                                  <span>Lesson completed</span>
                                </div>
                              ) : isNextLesson ? (
                                <div className="inline-flex items-center text-blue-600 text-xs bg-blue-50 px-1.5 py-0.5 rounded">
                                  <span>Next</span>
                                </div>
                              ) : !isAvailable ? (
                                <div className="flex items-center text-gray-400 text-xs">
                                  <LockIcon size={12} className="mr-1 flex-shrink-0" />
                                  <span>Locked</span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                      
                      return isAvailable ? (
                        <Link key={lessonId} href={`/app/lessons/${lessonId}`} className="block h-full">
                          {cardContent}
                        </Link>
                      ) : (
                        <div key={lessonId} className="h-full">{cardContent}</div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
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