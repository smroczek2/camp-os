"use client";

import { useState } from "react";
import { AccountHeader } from "./account-header";
import {
  RecordPaymentDialog,
  AddChargeDialog,
  AddNoteDialog,
  EditContactsDialog,
  ExportStatementDialog,
} from "./account-dialogs";

interface AccountHeaderWithActionsProps {
  account: {
    accountNumber: string | null;
    name: string;
    accountStatus: string;
  };
  accountId: string;
}

export function AccountHeaderWithActions({
  account,
  accountId,
}: AccountHeaderWithActionsProps) {
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [editContactsOpen, setEditContactsOpen] = useState(false);
  const [exportStatementOpen, setExportStatementOpen] = useState(false);

  return (
    <>
      <AccountHeader
        account={account}
        accountId={accountId}
        onRecordPayment={() => setRecordPaymentOpen(true)}
        onAddCharge={() => setAddChargeOpen(true)}
        onAddNote={() => setAddNoteOpen(true)}
        onEditContacts={() => setEditContactsOpen(true)}
        onExportStatement={() => setExportStatementOpen(true)}
      />

      {/* Dialogs */}
      <RecordPaymentDialog
        open={recordPaymentOpen}
        onOpenChange={setRecordPaymentOpen}
        accountId={accountId}
      />

      <AddChargeDialog
        open={addChargeOpen}
        onOpenChange={setAddChargeOpen}
        accountId={accountId}
      />

      <AddNoteDialog
        open={addNoteOpen}
        onOpenChange={setAddNoteOpen}
        accountId={accountId}
      />

      <EditContactsDialog
        open={editContactsOpen}
        onOpenChange={setEditContactsOpen}
        accountId={accountId}
      />

      <ExportStatementDialog
        open={exportStatementOpen}
        onOpenChange={setExportStatementOpen}
        accountId={accountId}
      />
    </>
  );
}
