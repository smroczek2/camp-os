"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2 } from "lucide-react";
import { deleteAccountNoteAction } from "@/app/actions/account-actions-notes";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Note = {
  id: string;
  note: string;
  createdAt: Date;
  creator: {
    id: string;
    name: string;
  };
};

interface AccountNotesListProps {
  notes: Note[];
}

export function AccountNotesList({ notes }: AccountNotesListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (noteId: string) => {
    setDeletingId(noteId);

    try {
      const result = await deleteAccountNoteAction(noteId);

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || "Failed to delete note");
      }
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("An unexpected error occurred");
    } finally {
      setDeletingId(null);
    }
  };

  if (notes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No notes yet. Add a note to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {notes.map((note) => (
        <div
          key={note.id}
          className="border rounded-lg p-4 space-y-2"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm whitespace-pre-wrap">{note.note}</p>
            </div>
            <div className="flex items-center gap-1">
              {/* Edit functionality will be added in Phase 3 */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === note.id}
                  >
                    {deletingId === note.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Note</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this note? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(note.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>By {note.creator.name}</span>
            <span>•</span>
            <span>{new Date(note.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
