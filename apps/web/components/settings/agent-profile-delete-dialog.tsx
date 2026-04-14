"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@kandev/ui/alert-dialog";
import type { ActiveSessionInfo } from "@/lib/types/agent-profile-errors";

export type DeleteDialogState =
  | { mode: "closed" }
  | { mode: "confirm" }
  | { mode: "conflict"; sessions: ActiveSessionInfo[] };

type AgentProfileDeleteDialogProps = {
  state: DeleteDialogState;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

function ConflictDescription({ sessions }: { sessions: ActiveSessionInfo[] }) {
  const tasks = sessions.filter((s) => !s.is_ephemeral);
  const quickChats = sessions.filter((s) => s.is_ephemeral);

  return (
    <div>
      <p>This profile is currently in use. Deleting it will affect the following:</p>
      {tasks.length > 0 && (
        <div className="mt-2">
          <p className="font-medium text-sm">Tasks:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            {tasks.map((t) => (
              <li key={t.task_id} className="text-sm">
                {t.task_title || "Untitled task"}
              </li>
            ))}
          </ul>
        </div>
      )}
      {quickChats.length > 0 && (
        <div className="mt-2">
          <p className="font-medium text-sm">Quick Chats:</p>
          <ul className="list-disc list-inside mt-1 space-y-0.5">
            {quickChats.map((t) => (
              <li key={t.task_id} className="text-sm">
                {t.task_title || "Untitled quick chat"}
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="mt-2">
        These sessions will no longer be able to use this profile. This action cannot be undone.
      </p>
    </div>
  );
}

export function AgentProfileDeleteDialog({
  state,
  onOpenChange,
  onConfirm,
}: AgentProfileDeleteDialogProps) {
  const isConflict = state.mode === "conflict";

  return (
    <AlertDialog open={state.mode !== "closed"} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete agent profile?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            {isConflict ? (
              <ConflictDescription sessions={state.sessions} />
            ) : (
              <p>Are you sure you want to delete this profile? This action cannot be undone.</p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="cursor-pointer bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isConflict ? "Delete Anyway" : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
