"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal, Copy, Trash2, Archive, Loader2 } from "lucide-react";
import { deleteSessionAction, duplicateSessionAction, archiveSessionAction } from "@/app/actions/session-actions";

interface SessionActionsDropdownProps {
  sessionId: string;
  sessionName: string;
  hasRegistrations: boolean;
}

export function SessionActionsDropdown({
  sessionId,
  sessionName,
  hasRegistrations,
}: SessionActionsDropdownProps) {
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  async function handleDuplicate() {
    setLoading(true);
    try {
      const result = await duplicateSessionAction({ sessionId });
      if (result.success && result.session) {
        router.push("/dashboard/admin/programs/" + result.session.id);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive() {
    setLoading(true);
    try {
      await archiveSessionAction({ sessionId });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const result = await deleteSessionAction({ sessionId });
      if (result.success) {
        router.push("/dashboard/admin/programs");
      }
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate Session
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleArchive}>
            <Archive className="h-4 w-4 mr-2" />
            Archive Session
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
            disabled={hasRegistrations}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {hasRegistrations ? "Cannot delete (has registrations)" : "Delete Session"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{sessionName}&quot;? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
