import { KeyboardShortcuts } from "@/components/admin/keyboard-shortcuts";

/**
 * Admin layout with keyboard shortcuts
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <KeyboardShortcuts />
    </>
  );
}
