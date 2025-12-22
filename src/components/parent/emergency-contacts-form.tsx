"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createEmergencyContactAction,
  deleteEmergencyContactAction,
} from "@/app/actions/emergency-contact-actions";
import {
  Plus,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  Trash2,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

type EmergencyContact = {
  id: string;
  childId: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  priority: number;
  isAuthorizedPickup: boolean;
  notes: string | null;
};

const RELATIONSHIPS = [
  "Mother",
  "Father",
  "Grandmother",
  "Grandfather",
  "Aunt",
  "Uncle",
  "Sibling",
  "Neighbor",
  "Family Friend",
  "Other",
];

interface AddEmergencyContactDialogProps {
  childId: string;
  childName: string;
  existingContacts?: EmergencyContact[];
}

export function AddEmergencyContactDialog({
  childId,
  childName,
  existingContacts = [],
}: AddEmergencyContactDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorizedPickup, setIsAuthorizedPickup] = useState(false);
  const router = useRouter();

  const nextPriority = existingContacts.length + 1;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      setError(null);
      const result = await createEmergencyContactAction({
        childId,
        name: formData.get("name") as string,
        relationship: formData.get("relationship") as string,
        phone: formData.get("phone") as string,
        email: (formData.get("email") as string) || null,
        priority: nextPriority,
        isAuthorizedPickup,
        notes: (formData.get("notes") as string) || null,
      });

      if (!result.success) {
        setError(result.error || "Failed to add contact");
        return;
      }

      setOpen(false);
      setIsAuthorizedPickup(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
            <DialogDescription>
              Add an emergency contact for {childName}. This person will be
              contacted in case of emergencies.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Jane Smith"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="relationship">Relationship *</Label>
              <Select name="relationship" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((rel) => (
                    <SelectItem key={rel} value={rel.toLowerCase()}>
                      {rel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="(555) 555-5555"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email (optional)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="jane@example.com"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAuthorizedPickup"
                checked={isAuthorizedPickup}
                onCheckedChange={(checked) =>
                  setIsAuthorizedPickup(checked === true)
                }
              />
              <Label
                htmlFor="isAuthorizedPickup"
                className="text-sm font-normal cursor-pointer"
              >
                Authorized to pick up child
              </Label>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any special instructions..."
                rows={2}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Contact
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EmergencyContactCardProps {
  contact: EmergencyContact;
  onDelete?: () => void;
}

export function EmergencyContactCard({
  contact,
  onDelete,
}: EmergencyContactCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Are you sure you want to remove this emergency contact?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deleteEmergencyContactAction({ id: contact.id });
      if (result.success) {
        router.refresh();
        onDelete?.();
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium">{contact.name}</span>
            <Badge variant="outline" className="text-xs capitalize">
              {contact.relationship}
            </Badge>
            {contact.isAuthorizedPickup && (
              <Badge className="bg-green-500 text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Pickup
              </Badge>
            )}
          </div>
          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              {contact.phone}
            </span>
            {contact.email && (
              <span className="flex items-center gap-2">
                <Mail className="h-3 w-3" />
                {contact.email}
              </span>
            )}
          </div>
          {contact.notes && (
            <p className="text-sm text-muted-foreground mt-2 italic">
              {contact.notes}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="secondary" className="text-xs">
            #{contact.priority}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 text-destructive" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EmergencyContactsListProps {
  childId: string;
  childName: string;
  contacts: EmergencyContact[];
}

export function EmergencyContactsList({
  childId,
  childName,
  contacts,
}: EmergencyContactsListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Phone className="h-4 w-4" />
          Emergency Contacts
        </h4>
        <AddEmergencyContactDialog
          childId={childId}
          childName={childName}
          existingContacts={contacts}
        />
      </div>
      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No emergency contacts added yet. Add at least one contact.
        </p>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact) => (
            <EmergencyContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
