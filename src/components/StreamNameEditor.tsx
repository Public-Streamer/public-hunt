import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle, Loader2, Edit3 } from "lucide-react";
import { useStreamNameManager } from "@/hooks/useStreamNameManager";
import type { LocalParticipant } from "livekit-client";

interface StreamNameEditorProps {
  eventId: string;
  userId?: string;
  participant?: LocalParticipant | null;
  className?: string;
  placeholder?: string;
}

export const StreamNameEditor: React.FC<StreamNameEditorProps> = ({
  eventId,
  userId,
  participant,
  className = "",
  placeholder = "Enter stream name...",
}) => {
  const {
    value,
    setValue,
    isEditing,
    isSaving,
    syncStatus,
    error,
    startEdit,
    cancelEdit,
    save,
    hasUnsavedChanges,
  } = useStreamNameManager({ eventId, userId, participant });

  // Render sync status indicator
  const renderSyncStatus = () => {
    switch (syncStatus) {
      case "saving":
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </Badge>
        );
      case "success":
        return (
          <Badge variant="default" className="gap-1 bg-green-500">
            <Check className="h-3 w-3" />
            Saved
          </Badge>
        );
      case "error":
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return hasUnsavedChanges ? (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Unsaved
          </Badge>
        ) : null;
    }
  };

  if (!isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {value || "No stream name"}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={startEdit}
          className="h-8 w-8 p-0"
          title="Edit stream name"
        >
          <Edit3 className="h-4 w-4" />
        </Button>
        {renderSyncStatus()}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          maxLength={64}
          disabled={isSaving}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelEdit();
            }
          }}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={save}
          disabled={isSaving || !hasUnsavedChanges}
          className="h-8 w-8 p-0"
          title="Save changes"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={cancelEdit}
          disabled={isSaving}
          className="h-8 w-8 p-0"
          title="Cancel changes"
        >
          <X className="h-4 w-4" />
        </Button>
        {renderSyncStatus()}
      </div>

      {error && (
        <div className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {hasUnsavedChanges && "Auto-saves after 2 seconds"}
        {!hasUnsavedChanges && "Press Enter to save, Esc to cancel"}
      </div>
    </div>
  );
};
