"use client";

import { Badge } from "@/components/ui/badge";
import { AccountActionsMenu } from "./account-actions-menu";

interface AccountHeaderProps {
  account: {
    accountNumber: string | null;
    name: string;
    accountStatus: string;
  };
  accountId: string;
  onRecordPayment?: () => void;
  onAddCharge?: () => void;
  onAddNote?: () => void;
  onEditContacts?: () => void;
  onExportStatement?: () => void;
}

export function AccountHeader({
  account,
  accountId,
  onRecordPayment,
  onAddCharge,
  onAddNote,
  onEditContacts,
  onExportStatement,
}: AccountHeaderProps) {
  const statusVariant = account.accountStatus === "active" ? "default" : "secondary";

  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{account.name}</h1>
          <Badge variant={statusVariant}>
            {account.accountStatus}
          </Badge>
        </div>
        {account.accountNumber && (
          <p className="text-sm text-muted-foreground mt-1">
            Account #{account.accountNumber}
          </p>
        )}
      </div>

      <AccountActionsMenu
        accountId={accountId}
        onRecordPayment={onRecordPayment}
        onAddCharge={onAddCharge}
        onAddNote={onAddNote}
        onEditContacts={onEditContacts}
        onExportStatement={onExportStatement}
      />
    </div>
  );
}
