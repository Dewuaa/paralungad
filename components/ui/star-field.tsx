"use client";

import React, { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
  speedX: number;
  speedY: number;
}

interface ShootingStar {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
}

export function StarField({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    
    const starCount = 200; // Increased star count

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
    };

    const initStars = () => {
      stars = [];
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2,
          opacity: Math.random(),
          speedX: (Math.random() - 0.5) * 0.05, // Slower drift
          speedY: (Math.random() - 0.5) * 0.05,
        });
      }
    };

    const createShootingStar = () => {
       const startX = Math.random() * canvas.width;
       const startY = Math.random() * (canvas.height / 2); // Mostly upper half
       const angle = Math.PI / 4 + (Math.random() - 0.5) * 0.5; // diagonally down-rightish
       
       shootingStars.push({
         x: startX,
         y: startY,
         length: Math.random() * 80 + 10,
         speed: Math.random() * 10 + 6, // Fast again
         opacity: 1,
         angle: angle
       });
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw Static Stars
      stars.forEach((star) => {
        star.x += star.speedX;
        star.y += star.speedY;

        if (star.x < 0) star.x = canvas.width;
        if (star.x > canvas.width) star.x = 0;
        if (star.y < 0) star.y = canvas.height;
        if (star.y > canvas.height) star.y = 0;

        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.7})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();

        if (Math.random() > 0.99) {
            star.opacity = Math.max(0.1, Math.min(1, star.opacity + (Math.random() - 0.5) * 0.2));
        }
      });

      // 2. Manage Shooting Stars
      // Spawn chance
      if (Math.random() < 0.02) { // 2% chance (Frequent again)
        createShootingStar();
      }

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const star = shootingStars[i];
        
        // Move
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.opacity -= 0.01; // Quick fade

        // Remove if invisible
        if (star.opacity <= 0) {
            shootingStars.splice(i, 1);
            continue;
        }

        // Draw Trail
        const endX = star.x - Math.cos(star.angle) * star.length;
        const endY = star.y - Math.sin(star.angle) * star.length;

        const gradient = ctx.createLinearGradient(star.x, star.y, endX, endY);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${star.opacity})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    animate();

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 z-0 ${className}`}
    />
  );
}
