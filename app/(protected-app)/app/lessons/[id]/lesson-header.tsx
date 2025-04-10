import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

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
}: LessonHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-4">
        <Link 
          href="/app" 
          className="text-teal-600 hover:text-teal-700 flex items-center gap-1 mr-6"
        >
          <ArrowLeft size={16} />
          <span>Return to course</span>
        </Link>
        {isCompleted && (
          <div className="bg-teal-100 text-teal-800 text-xs rounded-full px-3 py-1 flex items-center gap-1">
            <CheckCircle size={14} />
            <span>Completed</span>
          </div>
        )}
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900">
        Lesson {lessonNumber}: {title}
      </h1>
    </div>
  );
} 