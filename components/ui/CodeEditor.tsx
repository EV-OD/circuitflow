import React from 'react';
import Editor from '@monaco-editor/react';
import { useCircuit } from '../../context/CircuitContext';

interface CodeEditorProps {
  code: string;
  onChange?: (value: string | undefined) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange }) => {
  const { isDarkMode } = useCircuit();

  return (
    <div className="w-full h-full border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden">
      <Editor
        height="100%"
        defaultLanguage="ini" // 'ini' provides decent coloring for SPICE netlists
        value={code}
        theme={isDarkMode ? "vs-dark" : "light"}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
        }}
      />
    </div>
  );
};