"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

interface CopyLinkButtonProps {
  sessionId: string;
}

export function CopyLinkButton({ sessionId }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/sessions/${sessionId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="outline" onClick={handleCopy}>
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" />
          Copy Link
        </>
      )}
    </Button>
  );
}
