import { GitHubStars } from "./ui/github-stars";

export function SiteFooter() {
  return (
    <footer className="border-t py-6 text-center text-sm text-muted-foreground">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-3">
          <GitHubStars repo="campminder" />
          <p>
            Agentic Coding Starterpack by{" "}
            <a
              href="https://github.com/campminder"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              CampCo AI Lab
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
