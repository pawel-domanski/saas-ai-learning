'use client';

import { useState, useEffect } from 'react';
import posthog from 'posthog-js';

export default function PostHogDebugPage() {
  const [status, setStatus] = useState('Checking...');
  const [events, setEvents] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [host, setHost] = useState('');

  useEffect(() => {
    // Check environment variables
    const key = process.env.NEXT_PUBLIC_POSTHOG_API_KEY;
    const hostValue = process.env.NEXT_PUBLIC_POSTHOG_HOST;
    
    setApiKey(key ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : 'NOT SET');
    setHost(hostValue || 'NOT SET');

    // Check PostHog status
    const checkStatus = () => {
      if (posthog.__loaded) {
        setStatus('✅ PostHog is loaded and ready');
        console.log('PostHog distinct_id:', posthog.get_distinct_id());
        console.log('PostHog person properties:', posthog.get_property('$distinct_id'));
      } else {
        setStatus('❌ PostHog is NOT loaded');
      }
    };

    checkStatus();
    
    // Check again after 1 second in case it's still loading
    const timer = setTimeout(checkStatus, 1000);
    return () => clearTimeout(timer);
  }, []);

  const sendTestEvent = () => {
    try {
      if (posthog.__loaded) {
        const eventName = `test_event_${Date.now()}`;
        posthog.capture(eventName, {
          test_property: 'test_value',
          timestamp: new Date().toISOString(),
          page: 'debug_page'
        });
        
        const message = `✅ Event sent: ${eventName}`;
        setEvents(prev => [message, ...prev.slice(0, 4)]);
        console.log(message);
      } else {
        const message = '❌ PostHog not loaded, cannot send event';
        setEvents(prev => [message, ...prev.slice(0, 4)]);
        console.error(message);
      }
    } catch (error) {
      const message = `❌ Error sending event: ${error}`;
      setEvents(prev => [message, ...prev.slice(0, 4)]);
      console.error('Error sending event:', error);
    }
  };

  const sendPageview = () => {
    try {
      if (posthog.__loaded) {
        posthog.capture('$pageview', {
          $current_url: window.location.href,
          test_pageview: true
        });
        
        const message = '✅ Manual pageview sent';
        setEvents(prev => [message, ...prev.slice(0, 4)]);
        console.log(message);
      } else {
        const message = '❌ PostHog not loaded, cannot send pageview';
        setEvents(prev => [message, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      const message = `❌ Error sending pageview: ${error}`;
      setEvents(prev => [message, ...prev.slice(0, 4)]);
      console.error('Error sending pageview:', error);
    }
  };

  const checkNetworkRequests = () => {
    console.log('🔍 Check Network tab in DevTools for requests to:', host);
    console.log('🔍 Look for requests to: /decide, /e, /s');
    alert('Check Network tab in DevTools for PostHog requests. Look for requests to /decide, /e, /s endpoints.');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">PostHog Debug Page</h1>
      
      <div className="space-y-4">
        {/* Status */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <p className="text-lg">{status}</p>
        </div>

        {/* Configuration */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Configuration</h2>
          <div className="space-y-2">
            <p><strong>API Key:</strong> {apiKey}</p>
            <p><strong>Host:</strong> {host}</p>
            <p><strong>PostHog loaded:</strong> {posthog.__loaded ? '✅ Yes' : '❌ No'}</p>
            {posthog.__loaded && (
              <p><strong>Distinct ID:</strong> {posthog.get_distinct_id()}</p>
            )}
          </div>
        </div>

        {/* Test Buttons */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Events</h2>
          <div className="space-y-2">
            <button 
              onClick={sendTestEvent}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
            >
              Send Test Event
            </button>
            <button 
              onClick={sendPageview}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 mr-2"
            >
              Send Pageview
            </button>
            <button 
              onClick={checkNetworkRequests}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              Check Network Tab
            </button>
          </div>
        </div>

        {/* Recent Events */}
        <div className="p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Recent Events</h2>
          {events.length === 0 ? (
            <p className="text-gray-500">No events sent yet</p>
          ) : (
            <ul className="space-y-1">
              {events.map((event, index) => (
                <li key={index} className="text-sm">{event}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Instructions */}
        <div className="p-4 border rounded-lg bg-yellow-50">
          <h2 className="text-xl font-semibold mb-2">Debugging Steps</h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>Check if API key is correctly set in environment variables</li>
            <li>Open Browser DevTools (F12) → Console tab to see PostHog logs</li>
            <li>Open Browser DevTools (F12) → Network tab to see HTTP requests</li>
            <li>Click "Send Test Event" and check if request appears in Network tab</li>
            <li>Check PostHog dashboard after a few minutes for events</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 