'use client';

import { useEffect, useState } from 'react';
import { Markdown } from '@/components/ui/markdown';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function SlideshowClient({ subLessons }) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const totalSlides = subLessons?.length || 0;

  useEffect(() => {
    // Initialize with first slide
  }, []);

  const goToSlide = (slideNumber) => {
    if (slideNumber < 1 || slideNumber > totalSlides) return;
    setCurrentSlide(slideNumber);
  };

  const handlePrevious = () => {
    if (currentSlide > 1) {
      goToSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides) {
      goToSlide(currentSlide + 1);
    }
  };

  if (!subLessons || !subLessons.length) return null;

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Step by Step Guide</h2>
      
      {/* Enhanced slides container */}
      <div className="slides-container">
        {/* Modern nav controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="text-sm font-medium text-gray-600">
            Select a step:
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrevious}
              disabled={currentSlide === 1}
              className="group relative inline-flex items-center justify-center px-4 py-2 overflow-hidden font-medium text-blue-600 bg-blue-50 rounded-md shadow-md transition-all hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous step"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Previous</span>
            </button>
            
            <div className="text-sm font-medium text-gray-700 min-w-[60px] text-center">
              {currentSlide} of {totalSlides}
            </div>
            
            <button 
              onClick={handleNext}
              disabled={currentSlide === totalSlides}
              className="group relative inline-flex items-center justify-center px-4 py-2 overflow-hidden font-medium text-white bg-blue-600 rounded-md shadow-md transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next step"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
        
        {/* Interactive progress indicators */}
        <div className="flex justify-center gap-1 mb-8">
          {subLessons.map((_, index) => (
            <button 
              key={index} 
              onClick={() => goToSlide(index + 1)}
              className={`relative transition-all duration-300 ${
                index + 1 === currentSlide 
                  ? 'w-12 h-3 bg-blue-600' 
                  : index + 1 < currentSlide
                    ? 'w-10 h-3 bg-blue-400'
                    : 'w-10 h-3 bg-gray-200'
              } rounded-full hover:opacity-80`}
              aria-label={`Go to step ${index + 1}`}
            >
              {index + 1 === currentSlide && (
                <span className="absolute top-0 left-0 right-0 bottom-0 bg-blue-500 rounded-full animate-pulse opacity-70"></span>
              )}
            </button>
          ))}
        </div>
        
        {/* Enhanced slide content area */}
        <div className="relative overflow-hidden border border-gray-200 rounded-xl shadow-lg bg-white">
          {subLessons.map((subLesson, index) => (
            <div 
              key={index} 
              className={`slide p-8 transition-opacity duration-300 ${currentSlide === index + 1 ? 'block' : 'hidden'}`}
            >
              <div className="flex items-center mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold mr-4 shadow-md">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-gray-800">{subLesson.subject}</h3>
              </div>
              
              <div className="mb-6 text-gray-700 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                {subLesson.desc}
              </div>
              
              {subLesson.content && (
                <div className="pt-6 border-t border-gray-100">
                  <Markdown>{subLesson.content}</Markdown>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 