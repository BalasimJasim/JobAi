import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Edit2, Sparkles, RotateCcw, Save, AlertTriangle } from 'lucide-react';
import { debounce } from 'lodash';

interface ResumeSection {
  id: string;
  title: string;
  content: string;
  type?: string;
  metadata?: {
    [key: string]: unknown;
    improvementAreas?: string[];
    factualWarning?: boolean;
  };
  isEditing?: boolean;
  isImproving?: boolean;
  originalContent?: string;
  aiImproved?: boolean;
  lastEditTime?: number;
}

interface EditableResumeSectionProps {
  section: ResumeSection;
  index: number;
  onEdit: (index: number, content: string) => void;
  onImprove: (index: number) => Promise<void>;
  onRevert: (index: number) => void;
  onToggleEdit: (index: number) => void;
}

interface VersionHistory {
  content: string;
  timestamp: number;
}

export function EditableResumeSection({
  section,
  index,
  onEdit,
  onImprove,
  onRevert,
  onToggleEdit,
}: EditableResumeSectionProps) {
  const [localContent, setLocalContent] = useState(section.content);
  const [versionHistory, setVersionHistory] = useState<VersionHistory[]>([
    { content: section.content, timestamp: Date.now() },
  ]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [charCount, setCharCount] = useState(section.content.length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset local content when section content changes
  useEffect(() => {
    setLocalContent(section.content);
    setCharCount(section.content.length);
  }, [section.content]);

  // Debounced version of onEdit
  const debouncedEdit = useRef(
    debounce((content: string) => {
      onEdit(index, content);
    }, 300)
  ).current;

  // Handle content change
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setLocalContent(newContent);
    setCharCount(newContent.length);
    debouncedEdit(newContent);

    // Add to version history if significantly different
    if (Math.abs(newContent.length - versionHistory[currentVersionIndex].content.length) > 10) {
      const newHistory = versionHistory.slice(0, currentVersionIndex + 1);
      newHistory.push({ content: newContent, timestamp: Date.now() });
      if (newHistory.length > 5) newHistory.shift(); // Keep only last 5 versions
      setVersionHistory(newHistory);
      setCurrentVersionIndex(newHistory.length - 1);
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (currentVersionIndex > 0) {
      const newIndex = currentVersionIndex - 1;
      setCurrentVersionIndex(newIndex);
      const previousVersion = versionHistory[newIndex];
      setLocalContent(previousVersion.content);
      debouncedEdit(previousVersion.content);
    }
  };

  // Handle redo
  const handleRedo = () => {
    if (currentVersionIndex < versionHistory.length - 1) {
      const newIndex = currentVersionIndex + 1;
      setCurrentVersionIndex(newIndex);
      const nextVersion = versionHistory[newIndex];
      setLocalContent(nextVersion.content);
      debouncedEdit(nextVersion.content);
    }
  };

  // Validate content before saving
  const validateContent = (): boolean => {
    if (!localContent.trim()) {
      return false;
    }
    return true;
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [localContent]);

  return (
    <Card className="p-4 mb-4 relative">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{section.title}</h3>
        <div className="flex items-center space-x-2">
          {section.isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={currentVersionIndex === 0}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Undo
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={currentVersionIndex === versionHistory.length - 1}
              >
                Redo
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (validateContent()) {
                    onToggleEdit(index);
                  }
                }}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onToggleEdit(index)}
              >
                <Edit2 className="h-4 w-4 mr-1" />
                Edit
              </Button>
              {section.id !== 'header' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onImprove(index)}
                  disabled={section.isImproving}
                >
                  <Sparkles className="h-4 w-4 mr-1" />
                  {section.isImproving ? 'Enhancing...' : 'Enhance'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {section.isEditing ? (
        <div className="relative">
          <Textarea
            value={localContent}
            onChange={handleContentChange}
            className="min-h-[200px] resize-none"
            placeholder={`Enter ${section.title.toLowerCase()} content...`}
          />
          <div className="absolute bottom-2 right-2 text-sm text-gray-500">
            {charCount} characters
          </div>
          {!validateContent() && (
            <div className="flex items-center mt-2 text-red-500 text-sm">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Content cannot be empty
            </div>
          )}
        </div>
      ) : (
        <div className="whitespace-pre-wrap">
          {section.content}
          {section.id === 'header' && (
            <hr className="my-4 border-t border-gray-300 dark:border-gray-600" />
          )}
          {section.aiImproved && section.metadata?.improvementAreas && (
            <div className="mt-2 flex flex-wrap gap-2">
              {section.metadata.improvementAreas.map((area, i) => (
                <Badge key={i} variant="secondary">
                  {area}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
} 