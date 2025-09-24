import { useState, useRef, useEffect } from "react";
import { Play, Wand2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SqlEditorProps {
  onExecute: (sql: string) => void;
  isExecuting: boolean;
}

export default function SqlEditor({ onExecute, isExecuting }: SqlEditorProps) {
  const [sql, setSql] = useState("SELECT * FROM users LIMIT 10;");
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleExecute = () => {
    if (sql.trim() && !isExecuting) {
      onExecute(sql);
    }
  };

  const handleFormat = () => {
    // Basic SQL formatting
    const formatted = sql
      .replace(/\s+/g, ' ')
      .replace(/,/g, ',\n    ')
      .replace(/\bFROM\b/gi, '\nFROM')
      .replace(/\bWHERE\b/gi, '\nWHERE')
      .replace(/\bJOIN\b/gi, '\nJOIN')
      .replace(/\bORDER BY\b/gi, '\nORDER BY')
      .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
      .replace(/\bHAVING\b/gi, '\nHAVING')
      .replace(/\bLIMIT\b/gi, '\nLIMIT')
      .trim();
    setSql(formatted);
  };

  const handleClear = () => {
    setSql("");
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const updateCursorPosition = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPos);
      const lines = textBeforeCursor.split('\n');
      const line = lines.length;
      const column = lines[lines.length - 1].length + 1;
      setCursorPosition({ line, column });
    }
  };

  useEffect(() => {
    updateCursorPosition();
  }, [sql]);

  const getLineNumbers = () => {
    const lines = sql.split('\n');
    return lines.map((_, index) => index + 1);
  };

  return (
    <div className="flex-1 bg-secondary">
      {/* Editor Toolbar */}
      <div className="bg-card border-b border-border px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleExecute}
            disabled={isExecuting || !sql.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            size="sm"
            data-testid="button-execute-query"
          >
            <Play className="h-4 w-4 mr-2" />
            {isExecuting ? "Executing..." : "Execute (Ctrl+Enter)"}
          </Button>
          <Button
            onClick={handleFormat}
            variant="secondary"
            size="sm"
            data-testid="button-format-sql"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            Format
          </Button>
          <Button
            onClick={handleClear}
            variant="secondary"
            size="sm"
            data-testid="button-clear-editor"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear
          </Button>
        </div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <span data-testid="cursor-position">
            Line {cursorPosition.line}, Column {cursorPosition.column}
          </span>
          <span>•</span>
          <span>SQLite</span>
        </div>
      </div>

      {/* Code Editor */}
      <div className="flex h-80">
        {/* Line Numbers */}
        <div className="editor-line-numbers w-12 p-2 text-xs font-mono">
          {getLineNumbers().map((lineNum) => (
            <div key={lineNum}>{lineNum}</div>
          ))}
        </div>
        
        {/* Editor Content */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={sql}
            onChange={(e) => setSql(e.target.value)}
            onKeyDown={handleKeyDown}
            onSelect={updateCursorPosition}
            onFocus={updateCursorPosition}
            className="w-full h-full p-4 font-mono text-sm bg-background text-foreground border-0 outline-none resize-none"
            placeholder="Enter your SQL query here..."
            data-testid="sql-editor-textarea"
          />
        </div>
      </div>
    </div>
  );
}
