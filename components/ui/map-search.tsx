"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { useSound } from "@/components/sound-provider";

interface SearchResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
}

interface MapSearchProps {
  onSelectLocation: (lat: number, lng: number) => void;
}

export function MapSearch({ onSelectLocation }: MapSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { playHover, playClick } = useSound();

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 3) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        // Use Nominatim OpenStreetMap API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&limit=5`
        );
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-sm rounded-t-xl z-20"> {/* z-20 for layering */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="h-4 w-4 text-zinc-400 animate-spin" />
          ) : (
            <Search className="h-4 w-4 text-zinc-400 group-focus-within:text-white transition-colors" />
          )}
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-black/60 transition-all shadow-lg"
          placeholder="Search places..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
              if (results.length > 0) setIsOpen(true);
              playHover();
          }}
        />
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute mt-2 w-full bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <ul className="max-h-60 overflow-auto py-1 custom-scrollbar">
            {results.map((result) => (
              <li
                key={result.place_id}
              >
                <button
                    className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:text-white hover:bg-white/10 transition-colors flex items-start gap-3 group"
                    onClick={() => {
                        playClick();
                        onSelectLocation(parseFloat(result.lat), parseFloat(result.lon));
                        setIsOpen(false);
                        setQuery(result.display_name.split(",")[0]); // Keep short name
                    }}
                    onMouseEnter={playHover}
                >
                    <MapPin className="w-4 h-4 mt-0.5 text-zinc-500 group-hover:text-amber-400 transition-colors shrink-0" />
                    <span className="truncate">{result.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
