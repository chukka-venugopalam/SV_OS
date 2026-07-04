export function Footer() {
  return (
    <footer className="border-t border-neutral-200 px-6 py-4 dark:border-neutral-700">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-neutral-400 dark:text-neutral-500 sm:flex-row">
        <p>&copy; {new Date().getFullYear()} SV-OS. MIT License.</p>
        <div className="flex items-center gap-4">
          <a href="/docs" className="hover:text-neutral-600 dark:hover:text-neutral-300">
            Documentation
          </a>
          <a
            href="https://github.com/sv-os/sv-os"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
