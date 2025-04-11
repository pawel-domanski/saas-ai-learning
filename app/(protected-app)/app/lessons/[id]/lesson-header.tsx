import Link from 'next/link';
import { ArrowLeft, ChevronLeft, ChevronRight, Book } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LessonHeaderProps {
  lessonNumber: number;
  title: string;
  isCompleted: boolean;
  previousLessonId: number | null;
  nextLessonId: number | null;
}

export function LessonHeader({
  lessonNumber,
  title,
  isCompleted,
  previousLessonId,
  nextLessonId,
}: LessonHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Link 
            href="/app" 
            className="text-teal-600 hover:text-teal-700 flex items-center gap-1 mr-6"
          >
            <ArrowLeft size={16} />
            <span>Return to course</span>
          </Link>
          {isCompleted && (
            <div className="bg-teal-100 text-teal-800 text-xs rounded-full px-3 py-1 flex items-center gap-1">
              <Book size={14} />
              <span>Lesson completed</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {previousLessonId && (
            <Button asChild variant="outline" size="sm" className="flex items-center gap-1">
              <Link href={`/app/lessons/${previousLessonId}`}>
                <ChevronLeft size={16} />
                <span className="hidden sm:inline">Previous</span>
              </Link>
            </Button>
          )}
          
          {nextLessonId && isCompleted && (
            <Button asChild size="sm" className="flex items-center gap-1">
              <Link href={`/app/lessons/${nextLessonId}`}>
                <span className="hidden sm:inline">Next</span>
                <ChevronRight size={16} />
              </Link>
            </Button>
          )}
        </div>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900">
        Lesson {lessonNumber}: {title}
      </h1>
    </div>
  );
} 