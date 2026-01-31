"use client";

import { useMap } from "@/components/ui/map";
import { useEffect } from "react";

interface MapClickHandlerProps {
  onMapClick: (coordinates: { lat: number; lng: number }) => void;
  isPinningInfo: boolean;
}

export function MapClickHandler({ onMapClick, isPinningInfo }: MapClickHandlerProps) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (isPinningInfo) {
        onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
      }
    };

    // Change cursor
    if (isPinningInfo) {
      map.getCanvas().style.cursor = "crosshair";
    } else {
      map.getCanvas().style.cursor = "";
    }

    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      map.getCanvas().style.cursor = "";
    };
  }, [map, isPinningInfo, onMapClick]);

  return null;
}
