"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface TypewriterProps {
  lines: { text: string; className?: string }[];
  speed?: number;
  delayBetweenLines?: number;
  startDelay?: number;
  onComplete?: () => void;
}

export default function Typewriter({
  lines,
  speed = 40,
  delayBetweenLines = 300,
  startDelay = 0,
  onComplete,
}: TypewriterProps) {
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(timer);
  }, [startDelay]);

  useEffect(() => {
    if (!started || done) return;

    if (currentLine >= lines.length) {
      setDone(true);
      onComplete?.();
      return;
    }

    const line = lines[currentLine].text;

    if (currentChar < line.length) {
      const timer = setTimeout(() => setCurrentChar((c) => c + 1), speed);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        setCurrentLine((l) => l + 1);
        setCurrentChar(0);
      }, delayBetweenLines);
      return () => clearTimeout(timer);
    }
  }, [started, done, currentLine, currentChar, lines, speed, delayBetweenLines, onComplete]);

  if (!started) return null;

  return (
    <div>
      {lines.map((line, i) => {
        if (i > currentLine) return null;

        const displayed =
          i < currentLine
            ? line.text
            : line.text.slice(0, currentChar);

        const showCursor = i === currentLine && !done;

        return (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={line.className}
          >
            {displayed}
            {showCursor && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block w-[2px] h-[1em] bg-blue-500 ml-0.5 align-middle"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}