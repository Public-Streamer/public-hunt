import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Clock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { useEventSearch, SearchResult } from "@/hooks/useEventSearch";
import { cn } from "@/lib/utils";
import MediaBackground from "./MediaBackground";

interface EventSearchBoxProps {
  placeholder?: string;
  className?: string;
}

const EventSearchBox: React.FC<EventSearchBoxProps> = ({
  placeholder = "Search events, episodes, or channels…",
  className,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const debouncedQuery = useDebounce(searchQuery, 300);
  const { results, isLoading, error } = useEventSearch(debouncedQuery, {
    enabled: debouncedQuery.length >= 2,
  });

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("recent-event-searches");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(Array.isArray(parsed) ? parsed.slice(0, 5) : []);
      } catch {
        // Ignore invalid JSON
      }
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback(
    (query: string) => {
      const newRecent = [
        query,
        ...recentSearches.filter((q) => q !== query),
      ].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem("recent-event-searches", JSON.stringify(newRecent));
    },
    [recentSearches]
  );

  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    localStorage.removeItem("recent-event-searches");
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      const url = result.slug ? `/event/${result.slug}` : `/event/${result.id}`;
      saveRecentSearch(result.title);
      navigate(url);
      setIsOpen(false);
      setSelectedIndex(-1);
    },
    [navigate, saveRecentSearch]
  );

  const handleRecentSelect = useCallback((query: string) => {
    setSearchQuery(query);
    setIsOpen(false);
    setSelectedIndex(-1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      const items =
        results.length > 0
          ? results
          : searchQuery.length === 0
          ? recentSearches
          : [];

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % items.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev <= 0 ? items.length - 1 : prev - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < items.length) {
            if (results.length > 0) {
              handleSelect(results[selectedIndex]);
            } else if (searchQuery.length === 0 && recentSearches.length > 0) {
              handleRecentSelect(recentSearches[selectedIndex]);
            }
          }
          break;
        case "Escape":
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [
      isOpen,
      results,
      recentSearches,
      searchQuery,
      selectedIndex,
      handleSelect,
      handleRecentSelect,
    ]
  );

  const handleFocus = useCallback(() => {
    setIsOpen(true);
    setSelectedIndex(-1);
  }, []);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Delay hiding to allow clicks on dropdown items
    setTimeout(() => {
      if (!dropdownRef.current?.contains(document.activeElement)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }, 100);
  }, []);

  const showRecents = searchQuery.length === 0 && recentSearches.length > 0;
  const showResults = debouncedQuery.length >= 2 && results.length > 0;
  const showLoading = debouncedQuery.length >= 2 && isLoading;
  const showEmpty =
    debouncedQuery.length >= 2 && !isLoading && results.length === 0 && !error;
  const showError = error && debouncedQuery.length >= 2;

  return (
    <div className={cn("w-full max-w-2xl mx-auto relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="pl-10 h-12 text-base"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-dropdown"
          aria-autocomplete="list"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          id="search-dropdown"
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-64 overflow-y-auto"
          role="listbox"
        >
          {showRecents && (
            <div className="p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground font-medium">
                  Recent
                </span>
                <button
                  onClick={clearRecentSearches}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((query, index) => (
                <div
                  key={query}
                  role="option"
                  aria-selected={selectedIndex === index}
                  className={cn(
                    "flex items-center space-x-3 p-2 rounded cursor-pointer",
                    selectedIndex === index ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleRecentSelect(query)}
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-sm truncate">{query}</span>
                </div>
              ))}
            </div>
          )}

          {showLoading && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Searching…
            </div>
          )}

          {showResults && (
            <div className="p-2">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  role="option"
                  aria-selected={selectedIndex === index}
                  className={cn(
                    "flex items-center space-x-3 p-2 rounded cursor-pointer",
                    selectedIndex === index ? "bg-accent" : "hover:bg-accent/50"
                  )}
                  onClick={() => handleSelect(result)}
                >
                  <Link
                    to={
                      result.slug
                        ? `/event/${result.slug}`
                        : `/event/${result.id}`
                    }
                    className="w-10 h-10 rounded-md overflow-hidden bg-muted flex-shrink-0"
                  >
                    <MediaBackground
                      src={result.thumbnail}
                      fallback="/placeholder.svg"
                      className="w-full h-full"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {result.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showEmpty && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No events found
            </div>
          )}

          {showError && (
            <div className="p-4 text-center text-sm text-destructive">
              Couldn't load results
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EventSearchBox;
