"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Lock, MapPin, Calendar, Music, Search, ArrowUpDown, Filter, X, LayoutGrid, ChevronDown, Image as ImageIcon } from "lucide-react";
import { useState, useMemo } from "react";

interface Memory {
  id: number;
  location_name: string;
  content: string;
  media_url: string;
  memory_date: string;
  spotify_url?: string;
  unlock_date?: string;
  latitude: number;
  longitude: number;
}

interface MemoryGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
}

export function MemoryGallery({ isOpen, onClose, memories, onSelectMemory }: MemoryGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<'all' | 'locked' | 'unlocked'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  const filteredMemories = memories.filter(memory => {
    const matchesSearch = memory.location_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          memory.content.toLowerCase().includes(searchQuery.toLowerCase());

    const isLocked = memory.unlock_date && new Date(memory.unlock_date) > new Date();

    if (filter === 'locked') {
      return matchesSearch && isLocked;
    }
    if (filter === 'unlocked') {
      return matchesSearch && !isLocked;
    }
    return matchesSearch; // filter === 'all'
  });

  const sortedMemories = [...filteredMemories].sort((a, b) => {
    const dateA = new Date(a.memory_date).getTime();
    const dateB = new Date(b.memory_date).getTime();

    if (sortOrder === 'newest') {
      return dateB - dateA;
    } else { // 'oldest'
      return dateA - dateB;
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] h-[85dvh] max-w-4xl md:h-[85vh] bg-zinc-950 border-zinc-800 text-white flex flex-col p-0 overflow-hidden rounded-xl border">
        <DialogHeader className="p-3 md:p-6 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-xl z-10 shrink-0 space-y-3 md:space-y-4">
            <div className="flex items-center justify-between">
                <DialogTitle className="text-xl md:text-2xl font-bold flex items-center gap-3">
                    <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800">
                        <LayoutGrid className="w-5 h-5 md:w-6 md:h-6 text-amber-100" />
                    </div>
                    <span>Memory Gallery</span>
                    <span className="text-xs font-normal text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800 self-center mt-1">
                        {filteredMemories.length}
                    </span>
                </DialogTitle>
                <button 
                    onClick={onClose}
                    className="p-2 hover:bg-zinc-900 rounded-full transition-colors text-zinc-400 hover:text-white"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Controls Toolbar */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                        type="text"
                        placeholder="Search memories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-colors"
                    />
                </div>

                <div className="flex gap-2">
                    {/* Filter */}
                    {/* Filter (Custom Select) */}
                    <div className="relative">
                        <select 
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="bg-zinc-900/50 border border-zinc-800 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-zinc-600 cursor-pointer appearance-none text-zinc-300 hover:text-white transition-colors"
                        >
                            <option value="all">All Memories</option>
                            <option value="unlocked">Unlocked</option>
                            <option value="locked">Locked</option>
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                    </div>

                    {/* Sort */}
                    <button 
                        onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                        className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2 text-sm hover:bg-zinc-800 transition-colors text-zinc-300 hover:text-white"
                    >
                        <ArrowUpDown className="w-4 h-4" />
                        <span className="hidden sm:inline">{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
                    </button>
                </div>
            </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-3 md:p-8 scrollbar-hide">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-6">
                {sortedMemories.map((memory) => {
                    const isLocked = memory.unlock_date && new Date(memory.unlock_date) > new Date();

                    return (
                        <div 
                            key={memory.id}
                            onClick={() => {
                                onClose(); // Close gallery
                                onSelectMemory(memory); // Fly to on map
                            }}
                            className={`
                                group relative aspect-[3/4] rounded-lg md:rounded-xl overflow-hidden border border-zinc-800 cursor-pointer 
                                transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-zinc-600 active:scale-95
                                ${isLocked ? 'bg-zinc-900' : 'bg-black'}
                            `}
                        >
                            {/* Background Image (if Unlocked) */}
                            {!isLocked && memory.media_url ? (
                                <img 
                                    src={memory.media_url} 
                                    alt={memory.location_name}
                                    className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                                />
                            ) : null}

                            {/* Locked Overlay */}
                            {isLocked && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-zinc-950/80 border-2 border-dashed border-zinc-800 m-1 md:m-2 rounded-md">
                                    <Lock className="w-6 h-6 md:w-8 md:h-8 text-yellow-500 mb-1 md:mb-2" />
                                    <span className="text-yellow-500 font-bold text-xs md:text-sm uppercase tracking-wider">Locked</span>
                                    <span className="text-zinc-500 text-[10px] md:text-xs mt-1">
                                        {format(new Date(memory.unlock_date!), "MMM d, yyyy")}
                                    </span>
                                </div>
                            )}

                            {/* Gradient Overlay */}
                            {!isLocked && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                            )}

                            {/* Content Info */}
                            {!isLocked && (
                                <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 bg-gradient-to-t from-black via-black/50 to-transparent">
                                    <div className="flex flex-col gap-0.5">
                                        <h3 className="font-bold text-white text-sm md:text-base truncate drop-shadow-md">
                                            {memory.location_name}
                                        </h3>
                                          <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-zinc-300">
                                              <Calendar className="w-3 h-3 text-zinc-400" />
                                              {format(new Date(memory.memory_date), "MMM d")}
                                          </div>
                                        {memory.spotify_url && (
                                              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                                                  <Music className="w-3 h-3 text-green-400" />
                                              </div>
                                          )}
                                    </div>
                                    
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {memories.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 opacity-50">
                    <MapPin className="w-12 h-12 mb-4" />
                    <p>No memories pinned yet.</p>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
