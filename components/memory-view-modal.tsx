"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { Calendar, MapPin, Lock, Pencil, Trash2, X, Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useEffect, useState, useRef } from "react";
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

interface Comment {
  id: number;
  content: string;
  user_id: string;
  created_at: string;
}

interface MemoryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  memory: Memory | null;
  onEdit: (memory: Memory) => void;
  onDelete: (id: number) => void;
  currentUserId?: string;
}

export function MemoryViewModal({ isOpen, onClose, memory, onEdit, onDelete, currentUserId }: MemoryViewModalProps) {
  // -- Social State (Hooks must be first) --
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoadingSocial, setIsLoadingSocial] = useState(false);

  // Fetch Social Data
  useEffect(() => {
    if (!memory || !isOpen) return;

    const fetchSocialData = async () => {
        setIsLoadingSocial(true);
        // 1. Get Likes Count
        const { count } = await supabase
            .from('favorites')
            .select('*', { count: 'exact', head: true })
            .eq('memory_id', memory.id);
        
        setLikesCount(count || 0);

        // 2. Check if current user liked
        if (currentUserId) {
            const { data } = await supabase
                .from('favorites')
                .select('user_id')
                .eq('memory_id', memory.id)
                .eq('user_id', currentUserId)
                .single();
            setIsLiked(!!data);
        }

        // 3. Get Comments
        const { data: commentsData } = await supabase
            .from('comments')
            .select('*')
            .eq('memory_id', memory.id)
            .order('created_at', { ascending: true }); // Oldest first
        
        setComments(commentsData || []);
        setIsLoadingSocial(false);
    };

    fetchSocialData();
  }, [memory, isOpen, currentUserId]);

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
  const isOwner = currentUserId && memory.user_id === currentUserId;

  const handleToggleLike = async () => {
      if (!currentUserId) {
          toast.error("Please sign in to like memories.");
          return;
      }

      // Optimistic Update
      const previousIsLiked = isLiked;
      const previousCount = likesCount;
      
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);

      try {
          if (previousIsLiked) {
              // Unlike
              await supabase
                  .from('favorites')
                  .delete()
                  .eq('memory_id', memory.id)
                  .eq('user_id', currentUserId);
          } else {
              // Like
              await supabase
                  .from('favorites')
                  .insert({ memory_id: memory.id, user_id: currentUserId });
          }
      } catch (error) {
          // Revert on error
          console.error("Error toggling like:", error);
          setIsLiked(previousIsLiked);
          setLikesCount(previousCount);
          toast.error("Failed to update like.");
      }
  };

  const handlePostComment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUserId) {
           toast.error("Please sign in to comment.");
           return;
      }
      if (!newComment.trim()) return;

      setIsSubmittingComment(true);

      const { data, error } = await supabase
          .from('comments')
          .insert({
              content: newComment.trim(),
              memory_id: memory.id,
              user_id: currentUserId
          })
          .select()
          .single();

      if (error) {
          console.error("Error posting comment:", error);
          toast.error("Failed to post comment.");
      } else if (data) {
          setComments(prev => [...prev, data]);
          setNewComment("");
          // Scroll to bottom?
      }
      setIsSubmittingComment(false);
  };

  const handleDeleteComment = async (commentId: number) => {
      if (!confirm("Delete this comment?")) return;

      const { error } = await supabase.from('comments').delete().eq('id', commentId);
      if (!error) {
          setComments(prev => prev.filter(c => c.id !== commentId));
          toast.success("Comment deleted");
      }
  };
  


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
                
                {/* Actions for Locked Memory */}
                {isOwner && (
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
                )}

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
                
                {/* Close Button Overlay */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors text-white z-10"
                >
                    <X className="w-5 h-5" />
                </button>

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
                        {/* Action Buttons (Top Right of Text Area sort of, usually absolute but here flex) */}
                        <div className="flex gap-2 items-center">
                             {/* Like Button */}
                             <button
                                onClick={handleToggleLike}
                                className="group flex items-center gap-1.5 p-2 pr-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-all text-white"
                             >
                                <Heart className={`w-5 h-5 transition-colors ${isLiked ? "fill-red-500 text-red-500" : "text-zinc-300 group-hover:text-red-400"}`} />
                                <span className="text-xs font-semibold tabular-nums">{likesCount}</span>
                             </button>
                        {isOwner && (
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
                        )}
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
                        <div className="relative w-full h-[80px] rounded-xl overflow-hidden bg-black/20 animate-in fade-in duration-700 mt-auto">
                            <iframe 
                                style={{ borderRadius: '12px' }} 
                                src={spotifyEmbedUrl} 
                                width="100%" 
                                height="80" 
                                frameBorder="0" 
                                allowFullScreen 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                loading="lazy"
                            ></iframe>
                        </div>
                    )}
                </div>

                {/* Social Section (Comments) */}
                <div className="bg-zinc-900/50 border-t border-zinc-800 p-4 flex-1 flex flex-col min-h-[300px]">
                    <div className="flex items-center gap-2 mb-4 text-zinc-400 text-sm font-medium">
                        <MessageCircle className="w-4 h-4" />
                        Comments ({comments.length})
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto max-h-[300px] mb-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {comments.length === 0 ? (
                            <div className="text-center py-8 text-zinc-600 text-sm italic">
                                Be the first to leave a note on this memory.
                            </div>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 group">
                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 shrink-0">
                                        <span className="text-xs text-zinc-400 font-bold">?</span>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-zinc-300">
                                                {comment.user_id === memory.user_id ? "Author" : "Traveler"}
                                            </span>
                                            <span className="text-[10px] text-zinc-600">
                                                {format(new Date(comment.created_at), "MMM d, h:mm a")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/50 p-2 rounded-lg rounded-tl-none border border-zinc-800/50">
                                            {comment.content}
                                        </p>
                                        
                                        {/* Delete Comment (Owner) */}
                                        {currentUserId === comment.user_id && (
                                            <button 
                                                onClick={() => handleDeleteComment(comment.id)}
                                                className="text-[10px] text-red-900/0 group-hover:text-red-500/50 hover:!text-red-400 transition-all"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Comment Input */}
                    {currentUserId ? (
                        <form onSubmit={handlePostComment} className="relative mt-auto">
                            <input
                                type="text"
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Add a comment..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-full pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-zinc-600 focus:bg-zinc-900 transition-colors placeholder:text-zinc-600"
                            />
                            <button 
                                type="submit"
                                disabled={!newComment.trim() || isSubmittingComment}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:hover:bg-white transition-all"
                            >
                                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                        </form>
                    ) : (
                         <div className="text-center py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                             <p className="text-xs text-zinc-500">Sign in to leave a comment</p>
                         </div>
                    )}
                </div>
            </>
        )}

      </DialogContent>
    </Dialog>
  );
}
