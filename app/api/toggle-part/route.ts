import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // Extract partId from URL search params instead of JSON body
    const url = new URL(req.url);
    const partId = parseInt(url.searchParams.get('partId') || '0');

    // Validate partId is present
    if (!partId) {
      return NextResponse.json(
        { error: 'Part ID is required' }, 
        { status: 400 }
      );
    }

    // Pobierz aktualny stan widoczności części
    const cookieStore = await cookies();
    const openPartCookie = cookieStore.get('openPartId');
    const currentOpenPart = openPartCookie ? parseInt(openPartCookie.value) : 1;

    // Toggle - jeśli kliknięto już otwartą część, zamknij ją (ustaw na 0)
    // W przeciwnym razie otwórz klikniętą część
    const newOpenPart = currentOpenPart === partId ? 0 : partId;

    // Utwórz respons przekierowujący z powrotem na stronę główną
    const referer = req.headers.get('referer') || '/app';
    const response = NextResponse.redirect(referer);
    
    // Ustaw ciasteczko w response
    response.cookies.set({
      name: 'openPartId',
      value: newOpenPart.toString(),
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30, // 30 dni
    });

    return response;
  } catch (error) {
    console.error('Error toggling part visibility:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 