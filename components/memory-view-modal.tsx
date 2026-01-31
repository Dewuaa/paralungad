"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Calendar, MapPin, Lock } from "lucide-react";

interface Memory {
  id: number;
  location_name: string;
  content: string;
  media_url: string;
  memory_date: string;
  latitude: number;
  longitude: number;
  spotify_url?: string;
  unlock_date?: string;
}

interface MemoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
  onEdit: (memory: Memory) => void;
  onDelete: (id: number) => void;
}

export function MemoryViewModal({ isOpen, onClose, memory, onEdit, onDelete }: MemoryViewModalProps) {
  if (!memory) return null;

  // Helper to extract Spotify ID
  const getSpotifyEmbedUrl = (url: string) => {
    try {
        const urlObj = new URL(url);
        // Handle various spotify link formats
        if (urlObj.hostname === 'open.spotify.com') {
            const pathParts = urlObj.pathname.split('/');
            const type = pathParts[1]; // track, album, playlist
            const id = pathParts[2];
            return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
        }
    } catch (e) {
        return null;
    }
    return null;
  };

  const isLocked = memory.unlock_date && new Date(memory.unlock_date) > new Date();
  const spotifyEmbedUrl = memory.spotify_url ? getSpotifyEmbedUrl(memory.spotify_url) : null;
  
  // Lucide icons
  const { Pencil, Trash2 } = require('lucide-react'); // Dynamic import style to match file

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto p-0 bg-zinc-950 border-zinc-800 text-white gap-0">
        
        {isLocked ? (
            // LOCKED STATE
            <div className="flex flex-col items-center justify-center p-12 text-center space-y-4">
                <DialogTitle className="sr-only">Time Capsule Locked</DialogTitle>
                <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center border border-zinc-800">
                    <Lock className="w-8 h-8 text-yellow-500" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white mb-2">Time Capsule Locked</h2>
                    <p className="text-zinc-400 text-sm">
                        This memory is sealed until
                    </p>
                    <p className="text-yellow-500 font-mono mt-1 text-lg">
                        {format(new Date(memory.unlock_date!), "MMMM d, yyyy 'at' h:mm a")}
                    </p>
                </div>
                
                {/* Actions for Locked Memory (Delete only? Or allow Edit to check date?) */}
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={() => onEdit(memory)}
                        className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors text-zinc-400 hover:text-white"
                        title="Edit Memory"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => onDelete(memory.id)}
                        className="p-2 rounded-full bg-zinc-800 hover:bg-red-900/50 transition-colors text-zinc-400 hover:text-red-400"
                        title="Delete Memory"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-zinc-600 text-xs mt-4 italic">
                    "Patience is the calm acceptance that things can happen in a different order than the one you have in mind."
                </p>
            </div>
        ) : (
            // UNLOCKED STATE
            <>
                {/* Hero Image */}
                <div className="relative aspect-video w-full bg-zinc-900">
                {memory.media_url ? (
                    <img 
                        src={memory.media_url} 
                        alt={memory.location_name} 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                        No Image
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex justify-between items-end">
                        <div>
                            <DialogTitle className="text-xl font-bold text-white mb-1 shadow-black drop-shadow-md">
                                {memory.location_name}
                            </DialogTitle>
                            <div className="flex items-center gap-4 text-xs font-medium text-zinc-300">
                                <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    {memory.memory_date ? format(new Date(memory.memory_date), "MMMM d, yyyy") : "Unknown Date"}
                                </div>
                            </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                             <button 
                                onClick={() => onEdit(memory)}
                                className="p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors text-white"
                             >
                                <Pencil className="w-4 h-4" />
                             </button>
                             <button 
                                onClick={() => onDelete(memory.id)}
                                className="p-2 rounded-full bg-black/40 hover:bg-red-900/60 backdrop-blur-md transition-colors text-white hover:text-red-400"
                             >
                                <Trash2 className="w-4 h-4" />
                             </button>
                        </div>
                    </div>
                </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-zinc-300 leading-relaxed whitespace-pre-wrap font-light mb-6">
                        {memory.content || "No description provided."}
                    </p>

                    {/* Spotify Player */}
                    {spotifyEmbedUrl && (
                        <div className="relative w-full h-[152px] rounded-xl overflow-hidden bg-black/20 animate-in fade-in duration-700">
                            <iframe 
                                style={{ borderRadius: '12px' }} 
                                src={spotifyEmbedUrl} 
                                width="100%" 
                                height="152" 
                                frameBorder="0" 
                                allowFullScreen 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                loading="lazy"
                            ></iframe>
                        </div>
                    )}
                </div>
            </>
        )}

      </DialogContent>
    </Dialog>
  );
}
