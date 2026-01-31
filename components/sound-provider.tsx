"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playHover: () => void;
  playClick: () => void;
  playSuccess: () => void;
  playAmbient: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [isMuted, setIsMuted] = useState(true);
  
  // Audio Context Ref
  const audioContextRef = useRef<AudioContext | null>(null);
  const schedulerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const currentChordIndexRef = useRef<number>(0);

  // Initialize AudioContext
  useEffect(() => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContext) {
        audioContextRef.current = new AudioContext();
    }
    return () => {
        stopSequencer();
        audioContextRef.current?.close();
    };
  }, []);

  // --- SYNTH ENGINE: Dreamy Electric Piano ---
  const playNote = (ctx: AudioContext, freq: number, time: number, duration: number) => {
      // Voice 1: Sine (Fundamental)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.value = freq;
      
      // Voice 2: Triangle (Warmth/Harmonics) - slightly detuned
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.value = freq * 1.001; // Detune slightly for chorus effect

      // Envelope (ADSR - Soft Attack, Long Release)
      const attack = 0.8;
      const release = 4.0; 
      
      gain1.gain.setValueAtTime(0, time);
      gain1.gain.linearRampToValueAtTime(0.05, time + attack); // Soft volume
      gain1.gain.exponentialRampToValueAtTime(0.001, time + duration + release);

      gain2.gain.setValueAtTime(0, time);
      gain2.gain.linearRampToValueAtTime(0.02, time + attack); // Quieter harmonics
      gain2.gain.exponentialRampToValueAtTime(0.001, time + duration + release);

      // Connect
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      // Start/Stop
      osc1.start(time);
      osc1.stop(time + duration + release);
      osc2.start(time);
      osc2.stop(time + duration + release);
  };

  const isPlayingRef = useRef<boolean>(false);

  // --- COMPOSER: Romantic Chord Progression ---
  const CHORDS = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7 (I) - Hopeful start
      [174.61, 220.00, 261.63, 329.63], // Fmaj7 (IV) - Longing
      [196.00, 246.94, 293.66, 349.23], // G7    (V)  - Tension
      [220.00, 261.63, 329.63, 392.00], // Am7   (vi) - Melancholy
  ];

  const scheduleNextChord = () => {
      // Safety Check: If stopped, do not schedule next
      if (!isPlayingRef.current) return;

      const ctx = audioContextRef.current;
      if (!ctx) return;

      const tempo = 30; // BPM (Very Slow)
      const secondsPerBeat = 60.0 / tempo;
      const lookahead = 0.1; 

      if (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
          // Play current chord notes
          const chord = CHORDS[currentChordIndexRef.current];
          
          // Strum effect: play notes slightly offset
          chord.forEach((freq, i) => {
              // Random minor timing variation for "human" feel
              const strumDelay = i * 0.15; 
              playNote(ctx, freq, nextNoteTimeRef.current + strumDelay, 3.0);
          });

          // Advance
          nextNoteTimeRef.current += secondsPerBeat * 4; // 1 chord per 4 beats (measure)
          currentChordIndexRef.current = (currentChordIndexRef.current + 1) % CHORDS.length;
      }
      
      schedulerRef.current = window.requestAnimationFrame(scheduleNextChord);
  };

  const startSequencer = () => {
      if (!audioContextRef.current) return;
      
      // Prevent duplicates
      if (isPlayingRef.current) return;
      isPlayingRef.current = true;

      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      nextNoteTimeRef.current = ctx.currentTime;
      currentChordIndexRef.current = 0;
      scheduleNextChord();
  };

  const stopSequencer = () => {
      isPlayingRef.current = false; // Kill the flag to stop recursion
      if (schedulerRef.current) {
          window.cancelAnimationFrame(schedulerRef.current);
          schedulerRef.current = null;
      }
  };

  // Effect to manage Mute/Unmute toggle for the sequencer
  useEffect(() => {
      if (isMuted) {
          stopSequencer();
      } else {
          // Only start if explicitly desired (usually handling via user toggle)
          // But we need to ensure context is ready
          if (audioContextRef.current) {
             if (audioContextRef.current.state === 'suspended') {
                 audioContextRef.current.resume();
             }
             startSequencer();
          }
      }
  }, [isMuted]);

  const toggleMute = () => {
      setIsMuted(prev => !prev);
      // Removed direct side-effects from here to let useEffect handle it safely
  };

  // Keep UI tones simple
  const playTone = (freq: number, type: OscillatorType, duration: number, vol: number = 0.1) => {
    if (!audioContextRef.current || isMuted) return;
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  const playHover = () => playTone(800, 'sine', 0.05, 0.03);
  const playClick = () => playTone(300, 'triangle', 0.1, 0.08); 
  
  const playSuccess = () => {
      if (isMuted) return;
      setTimeout(() => playTone(523.25, 'sine', 0.6, 0.05), 0);
      setTimeout(() => playTone(659.25, 'sine', 0.6, 0.05), 100);
      setTimeout(() => playTone(783.99, 'sine', 1.0, 0.05), 200);
  };

  const playAmbient = () => {
      if (!isMuted) {
          startSequencer();
      }
  };

  return (
    <SoundContext.Provider value={{ isMuted, toggleMute, playHover, playClick, playSuccess, playAmbient }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
