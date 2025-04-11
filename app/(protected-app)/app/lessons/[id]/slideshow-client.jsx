'use client';

import { useEffect } from 'react';
import { Markdown } from '@/components/ui/markdown';

export default function SlideshowClient({ subLessons }) {
  // Initialize the slideshow
  useEffect(() => {
    function initSlideshow() {
      const slides = document.querySelectorAll('.slide');
      const prevButton = document.getElementById('prev-slide');
      const nextButton = document.getElementById('next-slide');
      const slideCounter = document.getElementById('slide-counter');
      const slideDots = document.querySelectorAll('.slide-dot');
      
      if (!slides.length || !prevButton || !nextButton) {
        console.log('Required slideshow elements not found');
        return;
      }
      
      console.log('Client component: Initializing slideshow with', slides.length, 'slides');
      let currentSlide = 1;
      const totalSlides = slides.length;
      
      // Function to update the slide counter
      function updateCounter() {
        if (slideCounter) {
          slideCounter.textContent = `${currentSlide} of ${totalSlides}`;
        }
      }
      
      // Function to update button states
      function updateButtons() {
        if (prevButton) prevButton.disabled = currentSlide === 1;
        if (nextButton) nextButton.disabled = currentSlide === totalSlides;
      }
      
      // Function to update indicator dots
      function updateDots() {
        slideDots.forEach((dot, index) => {
          if (index + 1 === currentSlide) {
            dot.classList.remove('bg-gray-300');
            dot.classList.add('bg-blue-500');
          } else {
            dot.classList.remove('bg-blue-500');
            dot.classList.add('bg-gray-300');
          }
        });
      }
      
      // Function to navigate to a specific slide
      function goToSlide(slideNumber) {
        if (slideNumber < 1 || slideNumber > totalSlides) {
          console.error('Invalid slide number:', slideNumber);
          return;
        }
        
        // Hide all slides
        slides.forEach(slide => {
          slide.style.display = 'none';
        });
        
        // Show the target slide
        const targetSlide = document.querySelector(`.slide[data-slide="${slideNumber}"]`);
        if (targetSlide) {
          targetSlide.style.display = 'block';
          console.log('Showing slide', slideNumber);
        } else {
          console.error('Could not find slide', slideNumber);
        }
        
        // Update current slide
        currentSlide = slideNumber;
        
        // Update UI elements
        updateCounter();
        updateButtons();
        updateDots();
      }
      
      // Add click handlers for navigation
      if (prevButton) {
        prevButton.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('Previous button clicked, current slide:', currentSlide);
          if (currentSlide > 1) {
            goToSlide(currentSlide - 1);
          }
        });
      }
      
      if (nextButton) {
        nextButton.addEventListener('click', function(e) {
          e.preventDefault();
          console.log('Next button clicked, current slide:', currentSlide);
          if (currentSlide < totalSlides) {
            goToSlide(currentSlide + 1);
          }
        });
      }
      
      // Add click handlers for dot indicators
      slideDots.forEach(dot => {
        dot.addEventListener('click', function() {
          const slideNumber = parseInt(this.getAttribute('data-slide') || '1');
          console.log('Dot clicked for slide:', slideNumber);
          goToSlide(slideNumber);
        });
      });
      
      // Initialize slideshow state
      updateCounter();
      updateButtons();
      updateDots();
      
      // Make sure the first slide is visible and others are hidden
      slides.forEach((slide, index) => {
        slide.style.display = index === 0 ? 'block' : 'none';
      });
    }

    // Try to initialize immediately
    initSlideshow();
    
    // Also try after a small delay to ensure DOM is ready
    const timeoutId = setTimeout(initSlideshow, 500);
    
    // Cleanup event listeners when component unmounts
    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  if (!subLessons || !subLessons.length) return null;

  return (
    <div className="mt-8 border-t pt-8">
      <h2 className="text-2xl font-bold mb-6">Step by Step Guide</h2>
      
      {/* Slides container */}
      <div className="slides-container">
        {/* Slide navigation */}
        <div className="flex justify-between mb-4">
          <div className="text-sm font-medium text-gray-500">
            Select a step: 
          </div>
          <div className="flex items-center gap-2">
            <button 
              id="prev-slide" 
              type="button"
              className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded border border-blue-200 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
              Previous
            </button>
            <span id="slide-counter" className="text-sm text-gray-500 min-w-[60px] text-center">1 of {subLessons.length}</span>
            <button 
              id="next-slide" 
              type="button"
              className="px-3 py-1.5 bg-blue-100 text-blue-600 rounded border border-blue-200 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
            >
              Next
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Slide indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {subLessons.map((_, index) => (
            <button 
              key={index} 
              type="button"
              data-slide={index + 1}
              className={`slide-dot w-8 h-2 rounded-full ${index === 0 ? 'bg-blue-500' : 'bg-gray-300'} hover:bg-blue-400 transition-colors duration-200`}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
        
        {/* Slides wrapper */}
        <div id="slides-wrapper" className="relative border border-gray-200 rounded-lg shadow-md">
          {subLessons.map((subLesson, index) => (
            <div 
              key={index} 
              data-slide={index + 1} 
              className="slide p-6" 
              style={{ display: index === 0 ? 'block' : 'none' }}
            >
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-blue-700">{subLesson.subject}</h3>
              </div>
              
              <div className="mb-6 text-gray-700">{subLesson.desc}</div>
              
              {subLesson.content && (
                <div className="pt-4 border-t border-gray-100">
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