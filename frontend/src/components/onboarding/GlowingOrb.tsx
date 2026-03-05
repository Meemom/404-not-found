"use client";

import { useEffect, useRef } from "react";

export default function GlowingOrb({ size = 200 }: { size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = 2;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const baseR = size * 0.32;

    const trails = [
      { speed: 0.6, radius: baseR, width: 1.8, length: 2.2, hue: 217, sat: 91, bright: 60 },
      { speed: -0.45, radius: baseR * 1.05, width: 1.4, length: 1.8, hue: 224, sat: 76, bright: 48 },
      { speed: 0.35, radius: baseR * 0.95, width: 2.2, length: 2.8, hue: 213, sat: 94, bright: 68 },
      { speed: -0.7, radius: baseR * 1.02, width: 1.0, length: 1.5, hue: 199, sat: 89, bright: 78 },
    ];

    const draw = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;
      ctx.clearRect(0, 0, size, size);

      // Outer ring glow
      ctx.save();
      ctx.shadowColor = "rgba(59, 130, 246, 0.4)";
      ctx.shadowBlur = 40;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(59, 130, 246, 0.08)";
      ctx.lineWidth = 12;
      ctx.stroke();
      ctx.restore();

      // Thin ring
      ctx.beginPath();
      ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(96, 165, 250, 0.15)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Orbital trails
      trails.forEach((trail) => {
        const angle = t * trail.speed;
        const hx = cx + Math.cos(angle) * trail.radius;
        const hy = cy + Math.sin(angle) * trail.radius;

        // Trail arc
        ctx.save();
        ctx.shadowColor = `hsla(${trail.hue},${trail.sat}%,${trail.bright}%,0.8)`;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(cx, cy, trail.radius, angle - trail.length, angle);
        const tg = ctx.createLinearGradient(
          cx + Math.cos(angle - trail.length) * trail.radius,
          cy + Math.sin(angle - trail.length) * trail.radius,
          hx,
          hy
        );
        tg.addColorStop(0, `hsla(${trail.hue},${trail.sat}%,${trail.bright}%,0)`);
        tg.addColorStop(0.7, `hsla(${trail.hue},${trail.sat}%,${trail.bright}%,0.3)`);
        tg.addColorStop(1, `hsla(${trail.hue},${trail.sat}%,${trail.bright}%,0.9)`);
        ctx.strokeStyle = tg;
        ctx.lineWidth = trail.width;
        ctx.lineCap = "round";
        ctx.stroke();
        ctx.restore();

        // Head dot
        ctx.save();
        ctx.shadowColor = `hsla(${trail.hue},40%,100%,1)`;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(hx, hy, trail.width * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${trail.hue},30%,98%,0.95)`;
        ctx.fill();
        ctx.restore();
      });

      // Inner glow
      const ig = ctx.createRadialGradient(cx, cy, 0, cx, cy, baseR * 0.6);
      ig.addColorStop(0, "rgba(147, 197, 253, 0.06)");
      ig.addColorStop(0.5, "rgba(59, 130, 246, 0.03)");
      ig.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = ig;
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Inner thin ring
      ctx.beginPath();
      ctx.arc(cx, cy, baseR * 0.7, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(96, 165, 250, 0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Breathing pulse ring
      const pr = baseR + Math.sin(t * 2) * 4;
      ctx.beginPath();
      ctx.arc(cx, cy, pr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(96, 165, 250, ${0.05 + Math.sin(t * 2) * 0.03})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: "block", margin: "0 auto" }}
    />
  );
}