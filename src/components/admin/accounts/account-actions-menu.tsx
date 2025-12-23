"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  CalendarPlus,
  DollarSign,
  Plus,
  StickyNote,
  Users,
  FileText,
} from "lucide-react";

interface AccountActionsMenuProps {
  accountId: string;
  onRecordPayment?: () => void;
  onAddCharge?: () => void;
  onAddNote?: () => void;
  onEditContacts?: () => void;
  onExportStatement?: () => void;
}

export function AccountActionsMenu({
  accountId,
  onRecordPayment,
  onAddCharge,
  onAddNote,
  onEditContacts,
  onExportStatement,
}: AccountActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleMakeReservation = () => {
    router.push(`/dashboard/admin/registrations/new?accountId=${accountId}`);
    setIsOpen(false);
  };

  const handleRecordPayment = () => {
    onRecordPayment?.();
    setIsOpen(false);
  };

  const handleAddCharge = () => {
    onAddCharge?.();
    setIsOpen(false);
  };

  const handleAddNote = () => {
    onAddNote?.();
    setIsOpen(false);
  };

  const handleEditContacts = () => {
    onEditContacts?.();
    setIsOpen(false);
  };

  const handleExportStatement = () => {
    onExportStatement?.();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">More actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Account Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleMakeReservation}>
          <CalendarPlus className="h-4 w-4 mr-2" />
          Make Reservation
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleRecordPayment}>
          <DollarSign className="h-4 w-4 mr-2" />
          Record Payment
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleAddCharge}>
          <Plus className="h-4 w-4 mr-2" />
          Add Charge
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleAddNote}>
          <StickyNote className="h-4 w-4 mr-2" />
          Add Note
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleEditContacts}>
          <Users className="h-4 w-4 mr-2" />
          Edit Contacts
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleExportStatement}>
          <FileText className="h-4 w-4 mr-2" />
          Export Statement
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
