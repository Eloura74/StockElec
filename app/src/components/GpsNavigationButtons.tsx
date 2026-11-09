"use client";

import React from "react";
import { Navigation, MapPin, ExternalLink } from "lucide-react";

interface GpsNavigationButtonsProps {
  destination: string;
  label?: string;
  className?: string;
  size?: "sm" | "md";
}

export function GpsNavigationButtons({
  destination,
  label,
  className = "",
  size = "md",
}: GpsNavigationButtonsProps) {
  if (!destination || !destination.trim()) return null;

  const encodedDest = encodeURIComponent(destination.trim());
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedDest}`;
  const wazeUrl = `https://waze.com/ul?q=${encodedDest}&navigate=yes`;

  const isSmall = size === "sm";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Bouton Google Maps */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Ouvrir dans Google Maps : ${destination}`}
        className={`inline-flex items-center gap-1.5 font-semibold rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-all active:scale-95 tactile-btn ${
          isSmall ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
        }`}
      >
        <MapPin
          className={
            isSmall ? "w-3 h-3 text-blue-600" : "w-3.5 h-3.5 text-blue-600"
          }
        />
        <span>Google Maps</span>
      </a>

      {/* Bouton Waze */}
      <a
        href={wazeUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Ouvrir dans Waze : ${destination}`}
        className={`inline-flex items-center gap-1.5 font-semibold rounded-xl bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/60 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 transition-all active:scale-95 tactile-btn ${
          isSmall ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs"
        }`}
      >
        <Navigation
          className={
            isSmall ? "w-3 h-3 text-cyan-600" : "w-3.5 h-3.5 text-cyan-600"
          }
        />
        <span>Waze</span>
      </a>
    </div>
  );
}
