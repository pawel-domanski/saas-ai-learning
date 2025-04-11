import { redirect } from 'next/navigation';
import { getUser, getTeamForUser, getAllUserProgress } from '@/lib/db/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { Book, LockIcon, BookType, ChevronDown, ChevronRight, Brain, Code, Lightbulb, FileText, Puzzle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cookies } from 'next/headers';

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

  // Pobierz postęp użytkownika z bazy danych
  const userProgress = await getAllUserProgress(user.id);
  const completedLessonIds = userProgress
    .filter(progress => progress.completed)
    .map(progress => progress.lessonId);
  
  const completedLessons = completedLessonIds.length;
  const percentComplete = Math.round((completedLessons / lessons.length) * 100);
  
  // Sprawdź, czy można ukończyć lekcję dzisiaj (czy użytkownik już ukończył lekcję dzisiaj)
  let canCompleteToday = true;
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Początek dzisiejszego dnia
  
  // Pobierz wartość LESSON_START z procesu środowiskowego
  const lessonStartEnv = process.env.LESSON_START;
  const lessonStart = lessonStartEnv ? parseInt(lessonStartEnv, 10) : 1;
  console.log('LESSON_START value:', lessonStart);
  
  // Sprawdź, czy użytkownik ukończył jakąś lekcję dzisiaj (z wyjątkiem lekcji w zakresie LESSON_START)
  const todayCompletedLessons = userProgress.filter(progress => {
    if (!progress.completed) return false;
    
    const completedDate = new Date(progress.updatedAt);
    completedDate.setHours(0, 0, 0, 0);
    return completedDate.getTime() === today.getTime() && progress.lessonId > lessonStart;
  });
  
  if (todayCompletedLessons.length > 0) {
    canCompleteToday = false;
  }

  // Określamy, które lekcje są dostępne dla użytkownika
  // 1. Ukończone lekcje są zawsze dostępne
  // 2. Lekcje do wartości LESSON_START są od razu dostępne
  // 3. Dodatkowo dostępna jest pierwsza nieukończona lekcja po LESSON_START
  const availableLessonIds: number[] = [...completedLessonIds];
  let nextAvailableLessonId = 1;

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
  
  // Pobierz cookies
  const cookieStore = cookies();
  
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
                  className={`group block w-full relative p-0 text-left cursor-pointer ${isOpen ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between p-4 hover:opacity-90 transition-opacity duration-200">
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
                        <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-50 transition-colors duration-200">
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
                                {lesson.lesson && (
                                  <span className="ml-1 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap inline-flex">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M8 6V18M12 6V18M16 6V18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    {lesson.lesson.length} steps
                                  </span>
                                )}
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
    </div>
  );
} 