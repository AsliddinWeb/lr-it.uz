"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { apiFetch } from "@/lib/api";

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string | null;
  url: string;
}

interface SearchResults {
  courses: SearchResultItem[];
  students: SearchResultItem[];
  enrollments: SearchResultItem[];
}

const EMPTY: SearchResults = { courses: [], students: [], enrollments: [] };

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(EMPTY);
      return;
    }
    const timeout = setTimeout(() => {
      apiFetch<SearchResults>(`/search?q=${encodeURIComponent(query)}`)
        .then(setResults)
        .catch(() => setResults(EMPTY));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(url: string) {
    onOpenChange(false);
    setQuery("");
    router.push(url);
  }

  const hasResults =
    results.courses.length > 0 || results.students.length > 0 || results.enrollments.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Qidirish (kurs, o'quvchi, so'rov)..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.trim() && !hasResults && <CommandEmpty>Hech narsa topilmadi.</CommandEmpty>}
        {results.courses.length > 0 && (
          <CommandGroup heading="Kurslar">
            {results.courses.map((item) => (
              <CommandItem key={item.id} onSelect={() => handleSelect(item.url)}>
                {item.title}
                {item.subtitle && (
                  <span className="ml-2 text-xs text-text-muted">{item.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.students.length > 0 && (
          <CommandGroup heading="O'quvchilar">
            {results.students.map((item) => (
              <CommandItem key={item.id} onSelect={() => handleSelect(item.url)}>
                {item.title}
                {item.subtitle && (
                  <span className="ml-2 text-xs text-text-muted">{item.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {results.enrollments.length > 0 && (
          <CommandGroup heading="So'rovlar">
            {results.enrollments.map((item) => (
              <CommandItem key={item.id} onSelect={() => handleSelect(item.url)}>
                {item.title}
                {item.subtitle && (
                  <span className="ml-2 text-xs text-text-muted">{item.subtitle}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
