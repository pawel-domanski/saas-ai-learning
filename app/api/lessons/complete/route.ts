import { NextRequest, NextResponse } from 'next/server';
import { getUser, markLessonAsCompleted, getAllUserProgress, getTeamForUser } from '@/lib/db/queries';
import { activityLogs, ActivityType } from '@/lib/db/schema';
import { db } from '@/lib/db/drizzle';

// Struktura do przechowywania informacji o ukończonych lekcjach
interface CompletedLesson {
  id: number;
  completedAt: string; // ISO string z datą ukończenia
}

export async function POST(req: NextRequest) {
  try {
    // Sprawdź, czy użytkownik jest zalogowany
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pobierz dane z formularza
    const formData = await req.formData();
    const lessonId = parseInt(formData.get('lessonId') as string);
    const partId = parseInt(formData.get('partId') as string);
    
    // Sprawdź, czy lessonId jest prawidłowy
    if (!lessonId || isNaN(lessonId)) {
      return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 });
    }

    // Pobierz wszystkie ukończone lekcje użytkownika z bazy danych
    const userProgress = await getAllUserProgress(user.id);
    const completedLessons = userProgress
      .filter(progress => progress.completed)
      .map(progress => progress.lessonId);
    
    // Sprawdź, czy lekcja została już ukończona
    const isLessonCompleted = completedLessons.includes(lessonId);
    if (isLessonCompleted) {
      const timestamp = Date.now();
      const url = new URL(req.url);
      const origin = url.origin;
      const redirectUrl = `${origin}/app/lessons/${lessonId}?t=${timestamp}`;
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
    
    // Pobierz wartość LESSON_START z procesu środowiskowego
    const lessonStartEnv = process.env.LESSON_START;
    const lessonStart = lessonStartEnv ? parseInt(lessonStartEnv) : 0;
    console.log('LESSON_START value (complete API):', lessonStart);
    
    // Jeśli lekcja jest jedną z pierwszych LESSON_START lekcji, pozwól na jej ukończenie bez limitu dziennego
    if (lessonId <= lessonStart) {
      console.log(`Lekcja ${lessonId} jest w zakresie LESSON_START (${lessonStart}), pomijam sprawdzanie limitu dziennego`);
    } else {
      // Sprawdź limit dzienny tylko dla lekcji powyżej LESSON_START
      // Znajdź ostatnio ukończoną lekcję z dzisiaj
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Początek dzisiejszego dnia
      
      // Pobierz wszystkie lekcje ukończone dzisiaj
      const todayCompletedLessons = userProgress.filter(progress => {
        if (!progress.completed) return false;
        
        const completedDate = new Date(progress.updatedAt);
        completedDate.setHours(0, 0, 0, 0);
        return completedDate.getTime() === today.getTime();
      });
      
      // Jeśli istnieje jakakolwiek lekcja ukończona dzisiaj (powyżej LESSON_START), 
      // nie pozwól na ukończenie kolejnej
      const hasCompletedLessonToday = todayCompletedLessons.some(
        progress => progress.lessonId > lessonStart
      );
      
      // Jeśli nie można ukończyć dzisiaj lekcji, przekieruj z komunikatem
      if (hasCompletedLessonToday) {
        const timestamp = Date.now();
        const url = new URL(req.url);
        const origin = url.origin;
        // Dodaj parametr z informacją o braku możliwości ukończenia
        const redirectUrl = `${origin}/app/lessons/${lessonId}?limitReached=true&t=${timestamp}`;
        
        const response = NextResponse.redirect(redirectUrl, { status: 303 });
        return response;
      }
    }
    
    // Oznacz lekcję jako ukończoną w bazie danych
    await markLessonAsCompleted(user.id, lessonId);
    
    // Pobierz zespół użytkownika, aby zapisać aktywność z team_id
    const userTeam = await getTeamForUser(user.id);
    
    // Zapisz aktywność użytkownika
    await db.insert(activityLogs).values({
      teamId: userTeam?.id || 0, // Use team ID or 0 if not found, but never null
      userId: user.id,
      action: ActivityType.LESSON_COMPLETED,
      ipAddress: req.headers.get('x-forwarded-for') || ''
    });
    
    // Przekieruj z powrotem do strony lekcji
    const timestamp = Date.now();
    const url = new URL(req.url);
    const origin = url.origin;
    const redirectUrl = `${origin}/app/lessons/${lessonId}?success=true&t=${timestamp}`;
    
    const response = NextResponse.redirect(redirectUrl, { status: 303 });
    
    // Ustaw ciasteczka dla ostatnio przeglądanej lekcji
    response.cookies.set({
      name: 'lastViewedLessonId',
      value: lessonId.toString(),
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 30  // 30 dni
    });
    
    // Jeśli przekazano partId, ustaw również, który rozdział ma być rozwinięty
    if (partId && !isNaN(partId)) {
      response.cookies.set({
        name: 'openPartId',
        value: partId.toString(),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 30  // 30 dni
      });
    }
    
    return response;
  } catch (error) {
    console.error('Error completing lesson:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 