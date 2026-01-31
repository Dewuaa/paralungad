"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Account created! You can now sign in.");
        setIsSignUp(false); // Switch to sign in creation
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Welcome back to Paraluman.");
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-black/90 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {isSignUp ? "Join Paraluman" : "Welcome Back"}
          </DialogTitle>
          <DialogDescription className="text-center text-zinc-400">
            {isSignUp
              ? "Create an account to start pinning memories."
              : "Sign in to access your cherished moments."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleAuth} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-white"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-white"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-white text-black hover:bg-gray-200"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>
        <div className="text-center text-sm text-zinc-400">
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-white hover:underline transition-all"
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
