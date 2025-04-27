'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronRight,
  Book as BookIcon,
  LockIcon as LockIconSvg
} from 'lucide-react';

interface Lesson {
  lessonId: number;
  subject: string;
  lesson: any[];
  part: number;
}

interface PartInfo {
  id: number;
  name: string;
  icon: string;
  lessons: Lesson[];
}

interface PartListProps {
  sortedParts: PartInfo[];
  initialOpenPartId: number;
  completedLessonIds: number[];
  availableLessonIds: number[];
  nextAvailableLessonId: number;
  lastViewedLessonId: number | null;
}

export default function PartList({
  sortedParts,
  initialOpenPartId,
  completedLessonIds,
  availableLessonIds,
  nextAvailableLessonId,
  lastViewedLessonId
}: PartListProps) {
  const [openPartId, setOpenPartId] = useState(initialOpenPartId);

  const togglePart = async (partId: number) => {
    const newOpen = openPartId === partId ? 0 : partId;
    setOpenPartId(newOpen);
    // Persist preference via API (no redirect)
    try {
      await fetch(`/api/toggle-part?partId=${partId}`, { method: 'POST' });
    } catch (err) {
      console.error('Failed to persist open part:', err);
    }
  };

  return (
    <div className="space-y-6 mb-8 w-full">
      {sortedParts.map((part) => {
        const isOpen = part.id === openPartId;
        const IconComponent = part.icon && typeof part.icon === 'string' ? require('lucide-react')[part.icon] : null;
        return (
          <div key={part.id} className="rounded-lg overflow-hidden shadow-md border border-gray-200 w-full">
            <button
              type="button"
              onClick={() => togglePart(part.id)}
              className={`group block w-full relative p-0 text-left transition-colors ${isOpen ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
            >
              <div className="flex items-center justify-between p-4 hover:opacity-90 duration-200 w-full">
                <div className="flex items-center flex-1 min-w-0">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center mr-4">
                    {IconComponent && <IconComponent className="text-white" size={24} />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-blue-700 truncate">{part.name}</h2>
                    <p className="text-sm text-blue-500">{part.lessons.length} lessons</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isOpen ? (
                    <div className="p-2 rounded-full bg-blue-100">
                      <ChevronDown className="text-blue-700" size={20} />
                    </div>
                  ) : (
                    <div className="p-2 rounded-full bg-gray-100 group-hover:bg-blue-50 duration-200">
                      <ChevronRight className="text-blue-600" size={20} />
                    </div>
                  )}
                </div>
              </div>
            </button>
            {isOpen && (
              <div className="border-t border-blue-100 bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 w-full overflow-hidden">
                  {part.lessons.map((lesson) => {
                    const lessonId = lesson.lessonId;
                    const isCompleted = completedLessonIds.includes(lessonId);
                    const isAvailable = availableLessonIds.includes(lessonId);
                    const isNextLesson = lessonId === nextAvailableLessonId;
                    const isCurrentLesson = lessonId === lastViewedLessonId;

                    return (
                      <div key={lessonId} className="h-full">
                        <Link
                          href={isAvailable ? `/app/lessons/${lessonId}` : '#'}
                          className={`${isAvailable ? 'cursor-pointer hover:shadow-md' : 'opacity-70'} block h-full`}
                        >
                          <div
                            className={`bg-white rounded-lg shadow h-full border-l-4 border border-gray-200 ${
                              isCompleted
                                ? 'border-l-teal-500'
                                : isNextLesson
                                ? 'border-l-blue-500'
                                : 'border-l-gray-200'
                            } ${isCurrentLesson ? 'ring-2 ring-blue-100' : ''} transition-all duration-200`}
                          >
                            <div className="p-3 h-full flex flex-col">
                              <div className="flex items-start">
                                <div
                                  className={`h-6 w-6 rounded-full flex items-center justify-center text-white font-semibold mr-2 flex-shrink-0 ${
                                    isNextLesson
                                      ? 'bg-blue-500'
                                      : 'bg-gradient-to-r from-blue-500 to-teal-500'
                                  }`}
                                >
                                  {lessonId}
                                </div>
                                <h3 className={`font-medium text-sm truncate ${
                                  isCompleted
                                    ? 'text-teal-700'
                                    : isNextLesson
                                    ? 'text-blue-700'
                                    : isAvailable
                                    ? 'text-gray-800'
                                    : 'text-gray-400'
                                }`}
                                >
                                  {lesson.subject}
                                </h3>
                              </div>

                              <div className="mt-auto pt-2 text-xs flex items-center gap-1">
                                {isCompleted ? (
                                  <><BookIcon size={12} className="text-teal-600" />Lesson completed</>
                                ) : isNextLesson ? (
                                  <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Next</span>
                                ) : !isAvailable ? (
                                  <><LockIconSvg size={12} className="text-gray-400" />Locked</>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 