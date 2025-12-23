"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface KeyboardShortcutsProps {
  onCreateNew?: () => void;
}

export function KeyboardShortcuts({ onCreateNew }: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let gKeyPressed = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // '?' - Show help dialog
      if (e.key === "?" && !e.shiftKey) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
        return;
      }

      // 'n' - Create new (if handler provided)
      if (e.key === "n" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        if (onCreateNew) {
          onCreateNew();
        }
        return;
      }

      // '/' - Focus search (if exists)
      if (e.key === "/") {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[type="search"]'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // 'g' key sequence
      if (e.key === "g" && !gKeyPressed) {
        gKeyPressed = true;
        setTimeout(() => {
          gKeyPressed = false;
        }, 1000);
        return;
      }

      // 'g h' - Go to home
      if (gKeyPressed && e.key === "h") {
        e.preventDefault();
        router.push("/dashboard/admin");
        gKeyPressed = false;
        return;
      }

      // 'g s' - Go to sessions
      if (gKeyPressed && e.key === "s") {
        e.preventDefault();
        router.push("/dashboard/admin/programs");
        gKeyPressed = false;
        return;
      }

      // 'g f' - Go to forms
      if (gKeyPressed && e.key === "f") {
        e.preventDefault();
        router.push("/dashboard/admin/forms");
        gKeyPressed = false;
        return;
      }

      // ESC - Close help dialog
      if (e.key === "Escape" && showHelp) {
        setShowHelp(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, onCreateNew, showHelp]);

  const shortcuts = [
    { keys: ["?"], description: "Show this help dialog" },
    ...(onCreateNew ? [{ keys: ["n"], description: "Create new" }] : []),
    { keys: ["/"], description: "Focus search" },
    { keys: ["g", "h"], description: "Go to dashboard home" },
    { keys: ["g", "s"], description: "Go to sessions" },
    { keys: ["g", "f"], description: "Go to forms" },
    { keys: ["Esc"], description: "Close dialogs" },
  ];

  return (
    <Dialog open={showHelp} onOpenChange={setShowHelp}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Speed up your workflow with these keyboard shortcuts
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-sm">{shortcut.description}</span>
              <div className="flex gap-1">
                {shortcut.keys.map((key, keyIndex) => (
                  <Badge key={keyIndex} variant="outline" className="font-mono">
                    {key}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Press <Badge variant="outline" className="font-mono mx-1">?</Badge> anytime to
          toggle this help dialog
        </p>
      </DialogContent>
    </Dialog>
  );
}
