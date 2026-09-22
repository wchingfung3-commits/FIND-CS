import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import type { Company } from "@/types";
import { searchCompanies } from "@/lib/search";

interface SearchBarProps {
  onSelectCompany: (companyId: string) => void;
}

export function SearchBar({ onSelectCompany }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim()) {
      const matched = searchCompanies(query);
      setResults(matched);
      setShowDropdown(true);
      setHighlightIndex(0);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }, [query]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
  };

  const selectCompany = (company: Company) => {
    setQuery("");
    setResults([]);
    setShowDropdown(false);
    onSelectCompany(company.id);
  };

  const handleSearch = () => {
    if (results.length === 1) {
      selectCompany(results[0]);
    } else if (results.length > 1) {
      setShowDropdown(true);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || results.length === 0) {
      if (e.key === "Enter") handleSearch();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectCompany(results[highlightIndex]);
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="搜尋公司，例如 HSBC、Klook、順豐"
            className="w-full rounded-xl border border-slate-200 bg-white pl-12 pr-10 py-3.5 text-base text-slate-800 placeholder:text-slate-400 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          {query && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="清除搜尋"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleSearch}
          className="rounded-xl bg-teal-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-teal-700 active:scale-[0.98]"
        >
          搜尋
        </button>
      </div>

      {showDropdown && results.length > 0 && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {results.map((company, idx) => (
            <li key={company.id}>
              <button
                type="button"
                onClick={() => selectCompany(company)}
                onMouseEnter={() => setHighlightIndex(idx)}
                className={`flex w-full items-center justify-between px-4 py-3 text-left transition ${
                  idx === highlightIndex ? "bg-teal-50" : "bg-white hover:bg-slate-50"
                }`}
              >
                <span className="font-medium text-slate-800">{company.name}</span>
                <span className="text-sm text-slate-400">{company.description}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showDropdown && query.trim() && results.length === 0 && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500 shadow-lg">
          找不到完全匹配的公司，請嘗試其他關鍵字。
        </div>
      )}
    </div>
  );
}
