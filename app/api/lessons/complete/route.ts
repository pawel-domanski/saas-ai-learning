import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';

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

    // Pobierz aktualne ciasteczko z ukończonymi lekcjami
    const completedLessonsCookie = req.cookies.get('completedLessons')?.value;
    let completedLessons: number[] = []; // Stara struktura
    let completedLessonsWithDates: CompletedLesson[] = []; // Nowa struktura
    
    if (completedLessonsCookie) {
      try {
        // Sprawdź, czy ciasteczko zawiera już nową strukturę (z datami)
        const parsed = JSON.parse(completedLessonsCookie);
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (typeof parsed[0] === 'object' && parsed[0].hasOwnProperty('id')) {
            // Nowy format z datami
            completedLessonsWithDates = parsed;
            completedLessons = parsed.map(item => item.id);
          } else {
            // Stary format - tylko numery lekcji
            completedLessons = parsed;
            // Konwertuj do nowego formatu
            completedLessonsWithDates = parsed.map(id => ({
              id,
              completedAt: new Date().toISOString()
            }));
          }
        }
      } catch (e) {
        console.error('Error parsing completedLessons cookie:', e);
      }
    }
    
    // Sprawdź, czy lekcja została już ukończona
    const isLessonCompleted = completedLessons.includes(lessonId);
    if (isLessonCompleted) {
      const timestamp = Date.now();
      const url = new URL(req.url);
      const origin = url.origin;
      const redirectUrl = `${origin}/app/lessons/${lessonId}?t=${timestamp}`;
      return NextResponse.redirect(redirectUrl, { status: 303 });
    }
    
    // Znajdź ostatnio ukończoną lekcję
    let canCompleteToday = true;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Początek dzisiejszego dnia
    
    if (completedLessonsWithDates.length > 0) {
      // Sortuj według daty ukończenia (od najnowszej)
      const sortedLessons = [...completedLessonsWithDates].sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
      
      const lastCompletedLesson = sortedLessons[0];
      const lastCompletedDate = new Date(lastCompletedLesson.completedAt);
      lastCompletedDate.setHours(0, 0, 0, 0); // Początek dnia ukończenia
      
      // Sprawdź, czy ostatnia lekcja została ukończona dzisiaj
      if (lastCompletedDate.getTime() === today.getTime()) {
        canCompleteToday = false;
      }
    }
    
    // Jeśli nie można ukończyć dzisiaj lekcji, przekieruj z komunikatem
    if (!canCompleteToday) {
      const timestamp = Date.now();
      const url = new URL(req.url);
      const origin = url.origin;
      // Dodaj parametr z informacją o braku możliwości ukończenia
      const redirectUrl = `${origin}/app/lessons/${lessonId}?limitReached=true&t=${timestamp}`;
      
      const response = NextResponse.redirect(redirectUrl, { status: 303 });
      return response;
    }
    
    // Dodaj bieżącą lekcję do ukończonych z datą ukończenia
    const now = new Date();
    const newCompletedLesson: CompletedLesson = {
      id: lessonId,
      completedAt: now.toISOString()
    };
    
    completedLessonsWithDates.push(newCompletedLesson);
    completedLessons.push(lessonId);
    
    // Zapisz zaktualizowaną listę ukończonych lekcji
    const completedLessonsJSON = JSON.stringify(completedLessonsWithDates);
    console.log('Setting completedLessons cookie:', completedLessonsJSON);
    
    // Przekieruj z powrotem do strony lekcji
    const timestamp = Date.now();
    const url = new URL(req.url);
    const origin = url.origin;
    const redirectUrl = `${origin}/app/lessons/${lessonId}?success=true&t=${timestamp}`;
    
    const response = NextResponse.redirect(redirectUrl, { status: 303 });
    
    // Zapisz ciasteczko z postępem ukończenia lekcji
    response.cookies.set({
      name: 'completedLessons',
      value: completedLessonsJSON,
      path: '/',
      httpOnly: false,           // Dostępne dla JavaScript
      secure: process.env.NODE_ENV === 'production', // Bezpieczne tylko w produkcji
      sameSite: 'strict',        // Ograniczenie do tego samego origin
      maxAge: 60 * 60 * 24 * 30  // 30 dni
    });
    
    // Ustaw ciasteczka dla ostatnio przeglądanej lekcji
    response.cookies.set({
      name: 'lastViewedLessonId',
      value: lessonId.toString(),
      path: '/',
      httpOnly: false,
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
        httpOnly: false,
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