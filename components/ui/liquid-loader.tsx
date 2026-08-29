"use client";

import React, { useState, useEffect } from "react";
import { useMounted } from "@/hooks/use-mounted";

/* Ported as-is and recoloured to the Archive palette: the wave runs from
   --red-deep through --red and --red-2 out to the cream paper, so the bars
   read as one plate fading up rather than seven unrelated hues. */
const colors = [
  "from-[#8e0c20] to-[#ff2233]",
  "from-[#a81028] to-[#ff3b3f]",
  "from-[#ff2233] to-[#ff5a4c]",
  "from-[#ff5a4c] to-[#ff7d6b]",
  "from-[#ff7d6b] to-[#ffa48f]",
  "from-[#ffa48f] to-[#ffd2c4]",
  "from-[#ffd2c4] to-[#f2ece4]",
];

/* the original picked its glow by substring-matching the class name; an
   index-parallel array does the same job without the string sniffing */
const glows = [
  "#8e0c20",
  "#c01430",
  "#ff2233",
  "#ff5a4c",
  "#ff7d6b",
  "#ffa48f",
  "#f2ece4",
];

const LiquidLoading = ({ running = true }: { running?: boolean }) => {
  const [heights, setHeights] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [droplets, setDroplets] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  /* the bar styles read Date.now() during render, so the server and the first
     client pass can never agree — hold the structure back until after mount */
  const mounted = useMounted();
  /* the bar styles are all functions of the clock; sampling it once per tick
     into state keeps render pure (and the value at most one 32ms frame stale,
     which is not visible) instead of calling Date.now() mid-render */
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setHeights((prev) =>
        prev.map((height, index) => {
          const maxHeight = 80;
          const delay = index * 0.8; // Increased delay for slower wave propagation
          const time = Date.now() * 0.001; // Much slower base speed

          // Primary wave with bounce effect
          const primaryWave = Math.sin(time + delay);

          // Secondary bounce wave (higher frequency, lower amplitude)
          const bounceWave = Math.sin(time * 4 + delay) * 0.15;

          // Tertiary ripple effect
          const ripple = Math.sin(time * 8 + delay) * 0.05;

          // Combine waves for liquid bounce effect
          const combinedWave = primaryWave + bounceWave + ripple;

          return maxHeight * combinedWave;
        }),
      );

      setNow(Date.now());

      // Animate droplets with liquid timing
      setDroplets((prev) =>
        prev.map((_, index) => {
          const delay = index * 0.8;
          const time = Date.now() * 0.001;
          const waveValue = Math.sin(time + delay);
          return waveValue > 0.8; // Show droplet at peak with tighter threshold
        }),
      );
    }, 32); // Slower frame rate for more liquid feel

    return () => clearInterval(interval);
  }, [running]);

  if (!mounted) return <div className="liquid-loader flex items-end space-x-4 p-8" />;

  return (
    <div className="liquid-loader flex items-end space-x-4 p-8">
      {heights.map((height, index) => (
        <div key={index} className="relative flex flex-col items-center">
          {/* Droplet with liquid physics */}
          <div
            className={`w-4 h-4 rounded-full bg-gradient-to-r ${colors[index]} mb-3 transition-all duration-500 ease-out ${
              droplets[index] ? "opacity-100" : "opacity-0"
            }`}
            style={{
              animationDelay: `${index * 0.2}s`,
              filter: "blur(0.5px)",
              transform: droplets[index]
                ? `translateY(${Math.sin(now * 0.008 + index * 0.5) * 3}px) scale(${0.8 + Math.sin(now * 0.006 + index * 0.3) * 0.4})`
                : "translateY(10px) scale(0.5)",
              boxShadow: droplets[index]
                ? `0 0 15px ${glows[index]}40`
                : "none",
            }}
          />

          {/* Main liquid bar with enhanced physics */}
          <div
            className={`w-10 bg-gradient-to-t ${colors[index]} rounded-full transition-all duration-200 ease-out relative overflow-hidden shadow-lg`}
            style={{
              height: `${Math.abs(height)}px`,
              transform: height < 0 ? "scaleY(-1)" : "scaleY(1)",
              transformOrigin: "bottom",
              filter: "blur(0.3px)",
              boxShadow: `0 0 20px ${glows[index]}50, inset 0 0 20px rgba(255,255,255,0.1)`,
            }}
          >
            {/* Liquid surface tension effect */}
            <div
              className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-white/40 to-transparent rounded-full"
              style={{
                transform: `translateY(${Math.sin(now * 0.003 + index * 0.5) * 1}px) scaleY(${0.8 + Math.sin(now * 0.004 + index * 0.3) * 0.3})`,
              }}
            />

            {/* Liquid wave effect */}
            <div
              className="absolute inset-0 bg-gradient-to-t from-white/20 via-white/10 to-transparent rounded-full"
              style={{
                transform: `translateY(${Math.sin(now * 0.002 + index * 0.5) * 2}px)`,
                background: `linear-gradient(0deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
              }}
            />

            {/* Shimmer effect */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full"
              style={{
                transform: `translateX(${Math.sin(now * 0.0015 + index * 0.7) * 8}px)`,
                width: "140%",
                left: "-20%",
              }}
            />

            {/* Bubble effect */}
            <div
              className="absolute w-2 h-2 bg-white/30 rounded-full"
              style={{
                top: `${20 + Math.sin(now * 0.003 + index * 0.8) * 10}%`,
                left: `${30 + Math.sin(now * 0.002 + index * 0.6) * 20}%`,
                transform: `scale(${0.5 + Math.sin(now * 0.004 + index * 0.4) * 0.5})`,
                opacity: Math.sin(now * 0.005 + index * 0.9) * 0.3 + 0.3,
              }}
            />
          </div>

          {/* Enhanced base droplet with liquid physics */}
          <div
            className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[index]} mt-2 transition-all duration-300`}
            style={{
              opacity: Math.sin(now * 0.003 + index * 0.9) * 0.4 + 0.6,
              transform: `scale(${0.6 + Math.sin(now * 0.002 + index * 0.6) * 0.4}) translateY(${Math.sin(now * 0.004 + index * 0.8) * 1}px)`,
              filter: "blur(0.2px)",
              boxShadow: `0 2px 8px ${glows[index]}40`,
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default LiquidLoading;
