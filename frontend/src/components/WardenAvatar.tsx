"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import idleFrame from "@/assets/warden_avatar/rotations/south.png";
import run0 from "@/assets/warden_avatar/animations/running-6-frames/south/frame_000.png";
import run1 from "@/assets/warden_avatar/animations/running-6-frames/south/frame_001.png";
import run2 from "@/assets/warden_avatar/animations/running-6-frames/south/frame_002.png";
import run3 from "@/assets/warden_avatar/animations/running-6-frames/south/frame_003.png";
import run4 from "@/assets/warden_avatar/animations/running-6-frames/south/frame_004.png";
import run5 from "@/assets/warden_avatar/animations/running-6-frames/south/frame_005.png";
import jump0 from "@/assets/warden_avatar/animations/jumping-2/south/frame_000.png";
import jump1 from "@/assets/warden_avatar/animations/jumping-2/south/frame_001.png";
import jump2 from "@/assets/warden_avatar/animations/jumping-2/south/frame_002.png";
import jump3 from "@/assets/warden_avatar/animations/jumping-2/south/frame_003.png";
import jump4 from "@/assets/warden_avatar/animations/jumping-2/south/frame_004.png";
import jump5 from "@/assets/warden_avatar/animations/jumping-2/south/frame_005.png";
import jump6 from "@/assets/warden_avatar/animations/jumping-2/south/frame_006.png";
import jump7 from "@/assets/warden_avatar/animations/jumping-2/south/frame_007.png";

const runningFrames = [run0, run1, run2, run3, run4, run5];
const jumpingFrames = [jump0, jump1, jump2, jump3, jump4, jump5, jump6, jump7];

interface WardenAvatarProps {
  size?: number;
  animation?: "idle" | "running" | "jumping";
}

export default function WardenAvatar({ size = 56, animation = "idle" }: WardenAvatarProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    if (animation === "idle") return;

    const fps = animation === "running" ? 8 : 10;
    const frames = animation === "running" ? runningFrames : jumpingFrames;
    const interval = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, 1000 / fps);

    return () => clearInterval(interval);
  }, [animation]);

  useEffect(() => {
    setFrameIndex(0);
  }, [animation]);

  const frames = animation === "running" ? runningFrames : jumpingFrames;
  const src = animation === "idle" ? idleFrame : frames[frameIndex];

  return (
    <div
      style={{ width: size, height: size }}
      className={animation === "idle" ? "warden-avatar-bob" : undefined}
    >
      <Image
        src={src}
        alt="Warden"
        width={size}
        height={size}
        style={{ imageRendering: "pixelated", width: size, height: size }}
        unoptimized
      />
      <style jsx global>{`
        @keyframes warden-bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .warden-avatar-bob {
          animation: warden-bob 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
