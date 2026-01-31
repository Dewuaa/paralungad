"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { MapControls, MapContext } from "@/components/ui/map"; // Keep MapControls, import MapContext
import { AuthModal } from "@/components/auth-modal";
import { AddMemoryModal } from "@/components/add-memory-modal";
import { MemoryViewModal } from "@/components/memory-view-modal";
import { MapClickHandler } from "@/components/map-click-handler";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import { LogOut, User as UserIcon, Plus, X, Grid } from "lucide-react";
import { MemoryLayer } from "@/components/memory-layer";
import { MemoryGallery } from "@/components/memory-gallery";
import { SoundProvider, useSound } from "@/components/sound-provider";
import { Volume2, VolumeX, Play } from "lucide-react";
import { JourneyController } from "@/components/journey-controller";
import { Map3DModel } from "@/components/ui/map-3d";
import { StarField } from "@/components/ui/star-field"; 
import { HamburgerMenu } from "@/components/ui/hamburger-menu";
import { DARK_MATTER_STYLE, CUSTOM_GLOBE_STYLE } from "@/lib/map-styles";
import MapLibreGL from "maplibre-gl"; // Import MapLibreGL direclty
import "maplibre-gl/dist/maplibre-gl.css"; // Ensure CSS is imported

const INITIAL_CENTER: [number, number] = [-74.006, 40.7128];

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

// Inner component to use the hook
function MapPageContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Audio Hook
  const { isMuted, toggleMute, playHover, playClick, playSuccess, playAmbient } = useSound();

  // Memory Creation State
  const [isPinningMode, setIsPinningMode] = useState(false);
  const [newMemoryLocation, setNewMemoryLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isAddMemoryModalOpen, setIsAddMemoryModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isJourneyMode, setIsJourneyMode] = useState(false);
  
  // Memory Display State
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [memoryToEdit, setMemoryToEdit] = useState<Memory | null>(null);
  
  // UI State
  const [showIntro, setShowIntro] = useState(true);
  
  // Map State for Direct Implementation
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreGL.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const fetchMemories = useCallback(async () => {
    if (!user) {
        setMemories([]);
        return;
    }
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id); // Only fetch user's memories for now

    if (error) {
      console.error('Error fetching memories:', error);
    } else {
        const memoryData = data || [];
        setMemories(memoryData);
    }
  }, [user]);



  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [user, fetchMemories]);

  // Try to play ambient on first user interaction or load if possible
  useEffect(() => {
      if (user && !showIntro) {
          playAmbient();
      }
  }, [user, showIntro, playAmbient]);

  // Direct MapLibre Initialization
  useEffect(() => {
      if (mapRef.current || !mapContainerRef.current) return;

      const map = new MapLibreGL.Map({
          container: mapContainerRef.current,
          style: CUSTOM_GLOBE_STYLE as any, // Use our new custom style
          center: INITIAL_CENTER,
          zoom: 1.5,
          pitch: 0,
          bearing: 0,
          renderWorldCopies: false,
          attributionControl: { compact: true }
      });

      mapRef.current = map;

      map.on('load', () => {
          // Enable globe projection
          map.setProjection({ type: 'globe' }); 
          setIsMapLoaded(true);
      });

      return () => {
          map.remove();
          mapRef.current = null;
      };
  }, []);

  const handleLogout = async () => {
    playClick();
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    setIsPinningMode(false);
    setMemories([]); // Clear memories on logout
  };

  const startPinning = () => {
    playClick();
    setIsPinningMode(true);
    // toast.info("Click anywhere on the globe to pin a memory."); // Redundant with overlay
  };

  const cancelPinning = () => {
    playClick();
    setIsPinningMode(false);
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    playClick(); // Pin drop sound?
    setNewMemoryLocation(coords);
    setIsAddMemoryModalOpen(true);
    setIsPinningMode(false); // Exit pinning mode
  };

  const handleMemoryClick = (memory: Memory) => {
    // Only select if we are NOT in pinning mode
    if (!isPinningMode) {
      playClick();
      setSelectedMemory(memory);
    }
  };

  // Delete Handler
  const handleDeleteMemory = async (id: number) => {
      if (!confirm("Are you sure you want to delete this memory? This cannot be undone.")) return;

      const { error } = await supabase.from('memories').delete().eq('id', id);

      if (error) {
          toast.error("Failed to delete memory.");
          console.error(error);
      } else {
          toast.success("Memory deleted.");
          playSuccess(); // Reuse success or different sound
          setMemories(prev => prev.filter(m => m.id !== id));
          setSelectedMemory(null); // Close view modal
      }
  };

  // Edit Handler
  const handleEditMemory = (memory: Memory) => {
      playClick();
      setMemoryToEdit(memory);
      setSelectedMemory(null); // Close view modal
      setIsAddMemoryModalOpen(true);
  };

  // Close Modals Helper
  const closeAddMemoryModal = () => {
      setIsAddMemoryModalOpen(false);
      setMemoryToEdit(null); // Reset edit state
  };

  // Intro Animation trigger
  useEffect(() => {
    // Wait a bit for map to load, then start animation
    const timer = setTimeout(() => {
        if (mapRef.current && isMapLoaded) {
            // Start the show
            // 1. Initial Position is set by default map props
            // 2. Fly to a slightly angled view
            mapRef.current.flyTo({
                center: INITIAL_CENTER,
                zoom: 3,
                pitch: 45,
                bearing: -20,
                speed: 0.5, // Slow, cinematic fly
                curve: 1.5,
                essential: true
            });
            
            // Hide intro overlay after a moment
            setTimeout(() => {
                setShowIntro(false);
            }, 2000); // Wait for fly-in to start establishing
        } else {
             // Fallback if map isn't ready immediately
             setShowIntro(false);
        }
    }, 2500); // Extended initial black screen for suspense

    return () => clearTimeout(timer);
  }, [isMapLoaded]);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      {/* Visual Effects */}
      <StarField />
      
      {/* Sound Toggle (Top Left) */}
      <div className={`absolute top-8 left-8 z-30 transition-opacity duration-1000 delay-[3000ms] ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
          <button
            onClick={() => {
                toggleMute();
                if (isMuted) playClick(); // Play sound when unmuting
            }}
            onMouseEnter={playHover}
            className="p-3 rounded-full bg-black/20 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center"
            title={isMuted ? "Unmute Ambient Sound" : "Mute Sound"}
          >
             {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
      </div>

      {/* Hamburger Menu (Top Right) */}
      <div className={`absolute top-8 right-8 z-50 transition-opacity duration-1000 delay-[3200ms] ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
         <HamburgerMenu 
            user={user}
            onLogout={handleLogout}
            onSelectLocation={(lat, lng) => {
                mapRef.current?.flyTo({
                    center: [lng, lat],
                    zoom: 12,
                    speed: 1.5,
                    essential: true
                });
            }}
         />
      </div>

      {/* Cinematic Intro Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-black flex items-center justify-center transition-opacity duration-[2000ms] pointer-events-none ${showIntro ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="flex flex-col items-center text-center px-4">
            <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 animate-pulse tracking-widest">
                PARALUMAN
            </h1>
            <p className="text-zinc-500 mt-4 text-xs md:text-sm tracking-[0.3em] md:tracking-[0.5em] uppercase fade-in">
                Loading Universe...
            </p>
        </div>
      </div>

      {/* Title Overlay - Fades in after intro */}
      <div className={`absolute top-8 md:top-10 left-0 right-0 z-20 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-[2000ms] delay-[2500ms] ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
        <h1 className="text-3xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 drop-shadow-lg font-serif tracking-tight px-4 text-center">
          Paraluman
        </h1>
        <p className="text-white/60 text-[10px] md:text-base font-light mt-2 tracking-wide md:tracking-widest uppercase text-center px-4">
          Your compass to cherished memories.
        </p>
      </div>

      {/* Pinning Instructions Overlay */}
      {isPinningMode && (
         <div className="absolute top-32 z-20 pointer-events-none animate-in fade-in slide-in-from-top-4 w-full flex justify-center">
            <div className="bg-black/70 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium shadow-xl">
               Click anywhere on the globe to place a pin
            </div>
         </div>
      )}
      
      {/* Interactive Globe Map */}
      <div className="absolute inset-0 w-full h-full z-10">
        {/* Map Container */}
        <div ref={mapContainerRef} className="w-full h-full" />
        
        {/* Map Context Provider for Children */}
        {/* This allows components like MapControls, MemoryLayer, etc to still work */}
        <MapContext.Provider value={{ map: mapRef.current, isLoaded: isMapLoaded }}>
            {/* Only render children when map is ready to avoid errors in they access map immediately */}
            {mapRef.current && (
                <>
                    <MapControls 
                        position="bottom-right" 
                        showZoom 
                        showCompass 
                    />

                    <MapClickHandler 
                        isPinningInfo={isPinningMode}
                        onMapClick={handleMapClick} 
                    />

                    <MemoryLayer 
                        memories={memories} 
                        onMemoryClick={handleMemoryClick} 
                    />
                    
                    {/* 3D Model Demo */}
                    <Map3DModel
                        id="radar-dish-demo"
                        modelUrl="https://maplibre.org/maplibre-gl-js/docs/assets/34M_17/34M_17.gltf"
                        position={[-74.006, 40.7128]}
                        scale={20}
                        rotation={[0, 90, 0]}
                        altitude={0}
                    />

                    <JourneyController 
                        isActive={isJourneyMode}
                        memories={memories}
                        onClose={() => setIsJourneyMode(false)}
                        onMemoryFocus={(memory) => {
                            // Optionally open the view modal or just highlight
                        }}
                    />
                </>
            )}
        </MapContext.Provider>
      </div>

      {/* Sign In Button (Centered Bottom if not logged in) */}
      {!user && (
           <div className={`absolute bottom-16 md:bottom-20 left-1/2 -translate-x-1/2 z-20 transition-opacity duration-1000 ${showIntro ? 'opacity-0' : 'opacity-100'} w-full flex justify-center px-4`}>
              <button 
                onClick={() => {
                    playClick();
                    setIsAuthModalOpen(true);
                }}
                onMouseEnter={playHover}
                className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm md:text-base font-medium text-black transition-all hover:bg-zinc-200 shadow-xl hover:scale-105 active:scale-95 w-full max-w-xs md:w-auto"
              >
                 <UserIcon className="w-5 h-5" />
                 Sign In to Start
              </button>
           </div>
      )}

      {/* Floating Dock (Bottom Center) */}
      <div className={`absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 transition-all duration-1000 delay-[3000ms] ${showIntro ? 'opacity-0 translate-y-[20px]' : 'opacity-100 translate-y-0'} w-full max-w-[95vw] md:w-auto flex justify-center`}>
        {user && (
          <div className="flex items-center gap-1 p-1.5 bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl overflow-hidden max-w-full">
            {isJourneyMode ? null : (
              isPinningMode ? (
              <div className="flex items-center justify-between gap-3 px-4 py-2 w-full md:w-auto">
                 <span className="text-xs md:text-sm font-medium text-zinc-200 animate-pulse whitespace-nowrap">Tap map to pin</span>
                 <button 
                    onClick={cancelPinning}
                    onMouseEnter={playHover}
                    className="p-1 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400 hover:text-white"
                 >
                    <X className="w-4 h-4" />
                 </button>
              </div>
            ) : (
              <>
                <button
                    onClick={startPinning}
                    onMouseEnter={playHover}
                    className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-all active:scale-95 flex-1 md:flex-initial"
                >
                    <Plus className="w-4 h-4" />
                    <span className="text-xs md:text-sm whitespace-nowrap">Add Memory</span>
                </button>
                <div className="w-px h-4 bg-zinc-700 mx-1" />
                <button
                    onClick={() => {
                        playClick();
                        setIsGalleryOpen(true);
                    }}
                    onMouseEnter={playHover}
                    className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-full text-white hover:bg-white/10 transition-all active:scale-95 flex-1 md:flex-initial"
                >
                    <Grid className="w-4 h-4" />
                    <span className="text-xs md:text-sm font-medium">Gallery</span>
                </button>
                
                {memories.length > 1 && (
                    <>
                        <div className="w-px h-4 bg-zinc-700 mx-1" />
                        <button
                            onClick={() => {
                                playClick();
                                setIsJourneyMode(true);
                            }}
                            onMouseEnter={playHover}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-full text-amber-300 hover:bg-white/10 transition-all active:scale-95"
                            title="Start Journey"
                        >
                            <Play className="w-4 h-4 fill-current" />
                        </button>
                    </>
                )}
              </>
            )
        )}
          </div>
        )}
      </div>



      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
            playSuccess();
            // Refetch or standard auth flow will update user
        }}
      />

      <AddMemoryModal
        isOpen={isAddMemoryModalOpen}
        onClose={closeAddMemoryModal}
        location={newMemoryLocation}
        onSuccess={() => {
            playSuccess();
            fetchMemories(); // Refresh map
        }}
        initialData={memoryToEdit}
      />
      
      <MemoryViewModal
        isOpen={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        memory={selectedMemory}
        onEdit={handleEditMemory}
        onDelete={handleDeleteMemory}
      />
      
      <MemoryGallery
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        memories={memories}
        onSelectMemory={(memory) => {
            playClick();
            // Fly to location
            if (mapRef.current) {
                mapRef.current.flyTo({
                    center: [memory.longitude, memory.latitude],
                    zoom: 4,
                    speed: 1.5,
                    essential: true
                });
            }
            // Optional: Open View Modal immediately too?
            // setSelectedMemory(memory); 
            // Let's just fly there for now, it's more dramatic. User can click the pin.
        }}
      />
    </main>
  );
}

export default function Home() {
    return (
        <SoundProvider>
            <MapPageContent />
        </SoundProvider>
    );
}

