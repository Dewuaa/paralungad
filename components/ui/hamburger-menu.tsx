"use client";

import React, { useState, useRef, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Menu, X, LogOut, Info, Map as MapIcon, User as UserIcon } from "lucide-react";
import { MapSearch } from "./map-search";
import { useSound } from "@/components/sound-provider";

interface HamburgerMenuProps {
  user: User | null;
  onLogout: () => void;
  onSelectLocation: (lat: number, lng: number) => void;
}

export function HamburgerMenu({ user, onLogout, onSelectLocation }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { playClick, playHover } = useSound();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative z-50">
      {/* Trigger Button */}
      <button
        onClick={() => {
            playClick();
            setIsOpen(!isOpen);
        }}
        onMouseEnter={playHover}
        className={`p-3 rounded-full backdrop-blur-md border transition-all duration-300 ${
            isOpen 
            ? "bg-white text-black border-white rotate-90" 
            : "bg-black/20 text-white border-white/10 hover:bg-white/10"
        }`}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-14 w-80 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 animate-in fade-in slide-in-from-top-4 origin-top-right flex flex-col gap-4">
            
            {/* 1. Embedded Search */}
            <div className="w-full">
                <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-widest pl-1">
                    Find Location
                </p>
                <div className="relative z-50"> 
                    {/* Pass handle to close menu on select if desired, or keep open */}
                    <MapSearch 
                        onSelectLocation={(lat, lng) => {
                            onSelectLocation(lat, lng);
                            setIsOpen(false); // Close menu on selection
                        }} 
                    />
                </div>
            </div>

            <div className="h-px bg-white/10 w-full" />

            {/* 2. User Profile */}
            {user ? (
                <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-200 to-yellow-500 flex items-center justify-center text-black font-bold">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-xs text-zinc-400">Signed in as</p>
                        <p className="text-sm text-white font-medium truncate w-full">
                            {user.email}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="p-3 text-center text-zinc-400 text-sm italic">
                    Guest Mode
                </div>
            )}

            {/* 3. Links */}
            <div className="flex flex-col gap-1">
                 <button className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-colors text-sm text-left">
                    <Info className="w-4 h-4" />
                    <span>About Paraluman</span>
                 </button>
            </div>

            <div className="h-px bg-white/10 w-full" />

            {/* 4. Sign Out */}
            {user && (
                <button
                    onClick={() => {
                        playClick();
                        onLogout();
                        setIsOpen(false);
                    }}
                    onMouseEnter={playHover}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-900/20 text-zinc-400 hover:text-red-400 transition-colors text-sm text-left w-full"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                </button>
            )}
        </div>
      )}
    </div>
  );
}
