'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { captureEvent } from '@/lib/posthog-helpers';

interface DocumentCompleteButtonProps {
  guideId: string;
  documentId: string;
  initialCompleted?: boolean;
}

export default function DocumentCompleteButton({ guideId, documentId, initialCompleted = false }: DocumentCompleteButtonProps) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [loading, setLoading] = useState(false);



  const handleComplete = async () => {
    if (completed) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('guideId', guideId);
      form.append('documentId', documentId.toString());
      const res = await fetch('/api/aiguides/complete', { method: 'POST', body: form });
      if (res.ok) {
        setCompleted(true);
        
        captureEvent('aiguide_document_completed', { 
          guideId, 
          documentId
        });
      } else {
        console.error('Failed to mark guide document as read');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return completed ? (
    <button
      disabled
      className="px-4 py-2 border border-teal-600 text-teal-600 rounded-lg mb-6"
    >
      Completed
    </button>
  ) : (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 mb-6 disabled:opacity-50"
    >
      {loading ? 'Saving...' : 'Mark as Read'}
    </button>
  );
} 