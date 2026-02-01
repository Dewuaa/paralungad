"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useMap } from "@/components/ui/map";
import { Play, Pause, SkipBack, SkipForward, X, MapPin } from "lucide-react";
import { useSound } from "@/components/sound-provider";
import { format } from "date-fns";
import { toast } from "sonner";

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
  is_public: boolean;
  user_id: string;
}

interface JourneyControllerProps {
  memories: Memory[];
  isActive: boolean;
  onClose: () => void;
  onMemoryFocus: (memory: Memory) => void;
}

export function JourneyController({ memories, isActive, onClose, onMemoryFocus }: JourneyControllerProps) {
  const { map } = useMap();
  const { playClick, playHover } = useSound();
  
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100 for current segment
  
  // Refs for animation loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const DURATION_PER_MEMORY = 8000; // Time spent at each memory including fly time
  
  // Filter and Sort memories (Chronological)
  const sortedMemories = useRef<Memory[]>([]);

  // Initialize sorted memories when entering mode
  useEffect(() => {
    if (isActive && memories.length > 0) {
      sortedMemories.current = [...memories].sort((a, b) => 
        new Date(a.memory_date).getTime() - new Date(b.memory_date).getTime()
      );
      setCurrentIndex(0);
      setIsPlaying(true);
      // Start immediately
      focusMemory(0);
    } else {
        setIsPlaying(false);
        stopTimer();
    }
  }, [isActive, memories]);

  const stopTimer = () => {
    if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
    }
  };

  const focusMemory = useCallback((index: number) => {
    if (!sortedMemories.current[index] || !map) return;
    
    const memory = sortedMemories.current[index];
    onMemoryFocus(memory); // Trigger the modal/tooltip in parent

    // Fly to the location
    map.flyTo({
        center: [memory.longitude, memory.latitude],
        zoom: 16, // Close up
        pitch: 60, // Cinematic angle
        bearing: Math.random() * 360, // Dynamic rotation
        speed: 0.8, // Slow and smooth
        curve: 1.5,
        essential: true
    });
  }, [map, onMemoryFocus]);

  // Auto-advance logic
  useEffect(() => {
    if (!isPlaying || !isActive) {
        stopTimer();
        return;
    }

    // Simple interval for now. 
    // Ideally we'd bind this to map "moveend" but that can be flaky with user interaction.
    // Let's use a fixed timer that resets on index change.
    
    stopTimer();
    
    // Progress bar animation
    const intervalTime = 100; // Update freq
    const steps = DURATION_PER_MEMORY / intervalTime;
    let currentStep = 0;

    timerRef.current = setInterval(() => {
        currentStep++;
        setProgress((currentStep / steps) * 100);

        if (currentStep >= steps) {
            handleNext();
        }
    }, intervalTime);

    return () => stopTimer();

  }, [currentIndex, isPlaying, isActive]);


  const handleNext = () => {
      if (currentIndex < sortedMemories.current.length - 1) {
          const next = currentIndex + 1;
          setCurrentIndex(next);
          focusMemory(next);
          setProgress(0);
      } else {
          // End of journey
          setIsPlaying(false);
          toast.success("Journey completed!");
      }
  };

  const handlePrev = () => {
      if (currentIndex > 0) {
          const prev = currentIndex - 1;
          setCurrentIndex(prev);
          focusMemory(prev);
          setProgress(0);
      }
  };

  const togglePlay = () => {
      playClick();
      setIsPlaying(!isPlaying);
  };

  if (!isActive) return null;

  const currentMemory = sortedMemories.current[currentIndex];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full md:w-auto flex flex-col items-center gap-2 animate-in slide-in-from-bottom-10 fade-in duration-500">
        
        {/* Info Card (Above Controls) */}
        {currentMemory && (
            <div className="mb-2 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 text-center shadow-2xl max-w-sm">
                <div className="text-[10px] text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
                    <MapPin className="w-3 h-3" />
                    Chapter {currentIndex + 1} of {sortedMemories.current.length}
                </div>
                <div className="text-white font-serif text-lg md:text-xl font-medium mt-1">
                    {format(new Date(currentMemory.memory_date), "MMMM d, yyyy")}
                </div>
            </div>
        )}

        {/* Controls Dock */}
        <div className="flex flex-col items-center gap-0 w-full max-w-md mx-6">
            {/* Progress Bar */}
            <div className="w-full h-1 bg-zinc-800 rounded-t-full overflow-hidden">
                <div 
                    className="h-full bg-white transition-all duration-100 ease-linear"
                    style={{ width: `${progress}%` }}
                />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4 bg-zinc-950/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-b-2xl rounded-t-sm shadow-2xl">
                
                <button 
                    onClick={() => { playClick(); handlePrev(); }}
                    onMouseEnter={playHover}
                    disabled={currentIndex === 0}
                    className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                >
                    <SkipBack className="w-5 h-5" />
                </button>

                <button 
                    onClick={togglePlay}
                    onMouseEnter={playHover}
                    className="w-12 h-12 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                </button>

                <button 
                    onClick={() => { playClick(); handleNext(); }}
                    onMouseEnter={playHover}
                    disabled={currentIndex === sortedMemories.current.length - 1}
                    className="text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                >
                    <SkipForward className="w-5 h-5" />
                </button>

                <div className="w-px h-6 bg-zinc-800 mx-2" />

                <button 
                    onClick={() => { playClick(); onClose(); }}
                    onMouseEnter={playHover}
                    className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-full transition-all"
                    title="Exit Journey Mode"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    </div>
  );
}
