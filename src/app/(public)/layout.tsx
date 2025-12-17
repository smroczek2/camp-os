import { ThemeProvider } from "@/components/theme-provider";

/**
 * Public pages layout
 * These pages don't use the global site header/footer
 * (signup, login, etc. have their own UI)
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
