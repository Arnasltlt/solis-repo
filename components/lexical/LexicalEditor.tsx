import React from 'react';

export default function LexicalEditor({ 
  initialContent = null,
  onChange
}: {
  initialContent?: any;
  onChange?: (content: any) => void;
}) {
  React.useEffect(() => {
    // Call onChange with empty content to avoid errors
    if (onChange) {
      onChange('{}');
    }
  }, [onChange]);

  return (
    <div className="editor-disabled" style={{ 
      border: '1px solid #ccc', 
      padding: '16px',
      minHeight: '200px',
      backgroundColor: '#f5f5f5'
    }}>
      <p>Editor temporarily disabled for TypeScript compatibility.</p>
    </div>
  );
} 