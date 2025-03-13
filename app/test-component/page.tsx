'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useSupabase } from '@/components/supabase-provider';

// Dynamically import the editor to avoid SSR issues
const LexicalEditor = dynamic(
  () => import('@/components/lexical/LexicalEditor'),
  { ssr: false }
);

export default function TestComponentPage() {
  const [editorContent, setEditorContent] = useState('');
  const [savedContent, setSavedContent] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const { session } = useSupabase();
  
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} - ${message}`]);
  };

  const handleEditorChange = (content: string) => {
    setEditorContent(content);
    addLog('Editor content updated');
  };

  const handleSave = () => {
    setSavedContent(editorContent);
    addLog('Content saved');
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Lexical Block Editor Test</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">1. Authentication Status</h2>
        <div className="p-4 bg-gray-50 rounded-md">
          {session ? (
            <div className="text-green-600">
              ✅ Authenticated as {session.user.email}
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Not authenticated - Please log in first
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">2. Lexical Editor</h2>
        <p className="mb-4 text-gray-600">
          Use the toolbar buttons to format text, add headings, create lists, or insert images and videos.
        </p>
        <div className="border rounded-lg overflow-hidden mb-4">
          <LexicalEditor onChange={handleEditorChange} />
        </div>
        <Button onClick={handleSave}>Save Content</Button>
      </div>

      {savedContent && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-2">3. Saved Content (JSON)</h2>
          <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-[200px] text-xs">
            {savedContent}
          </pre>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">4. Logs</h2>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-md font-mono text-sm h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log.includes('ERROR') ? (
                  <span className="text-red-400">{log}</span>
                ) : log.includes('WARN') ? (
                  <span className="text-yellow-400">{log}</span>
                ) : log.includes('successful') || log.includes('Success') ? (
                  <span className="text-green-400">{log}</span>
                ) : (
                  <span>{log}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}