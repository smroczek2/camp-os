"use client";

import { useState, ReactNode } from "react";
import { AccountHeader } from "./account-header";
import { AccountTabsNav } from "./account-tabs-nav";
import {
  RecordPaymentDialog,
  AddChargeDialog,
  AddNoteDialog,
  EditContactsDialog,
  ExportStatementDialog,
} from "./account-dialogs";

interface AccountLayoutProps {
  account: {
    accountNumber: string | null;
    name: string;
    accountStatus: string;
  };
  accountId: string;
  showTabs?: boolean;
  children: ReactNode;
}

export function AccountLayout({
  account,
  accountId,
  showTabs = true,
  children,
}: AccountLayoutProps) {
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [addChargeOpen, setAddChargeOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [editContactsOpen, setEditContactsOpen] = useState(false);
  const [exportStatementOpen, setExportStatementOpen] = useState(false);

  return (
    <div className="container mx-auto py-8 space-y-6">
      <AccountHeader
        account={account}
        accountId={accountId}
        onRecordPayment={() => setRecordPaymentOpen(true)}
        onAddCharge={() => setAddChargeOpen(true)}
        onAddNote={() => setAddNoteOpen(true)}
        onEditContacts={() => setEditContactsOpen(true)}
        onExportStatement={() => setExportStatementOpen(true)}
      />

      {showTabs && <AccountTabsNav accountId={accountId} />}

      {children}

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
    </div>
  );
}
