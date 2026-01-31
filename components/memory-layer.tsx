"use client";

import { useMap } from "@/components/ui/map";
import { useEffect, useRef } from "react";
import type { FeatureCollection } from 'geojson';

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
}

interface MemoryLayerProps {
  memories: Memory[];
  onMemoryClick: (memory: Memory) => void;
}

export function MemoryLayer({ memories, onMemoryClick }: MemoryLayerProps) {
  const { map, isLoaded } = useMap();
  const sourceId = "memories-source";
  const layerId = "memories-layer";
  const haloLayerId = "memories-halo";
  
  // Keep refs for callback stability
  const memoriesRef = useRef(memories);
  const onMemoryClickRef = useRef(onMemoryClick);

  useEffect(() => {
    memoriesRef.current = memories;
    onMemoryClickRef.current = onMemoryClick;
  }, [memories, onMemoryClick]);

  // 1. Initialize Layers
  useEffect(() => {
    if (!map || !isLoaded) return;

    // --- Line / Constellation Layers ---
    const ensureLineSource = () => {
       if (!map.getSource("constellation-source")) {
           map.addSource("constellation-source", {
               type: "geojson",
               data: { type: "FeatureCollection", features: [] }
           });
       }
    };

    const ensureLineLayers = () => {
        // Glowing Background Line
        if (!map.getLayer("constellation-glow")) {
            map.addLayer({
                id: "constellation-glow",
                type: "line",
                source: "constellation-source",
                layout: {
                    "line-join": "round",
                    "line-cap": "round"
                },
                paint: {
                    "line-color": "#ffffff",
                    "line-width": 6,
                    "line-opacity": 0.2,
                    "line-blur": 4
                }
            });
        }

        // Sharp Core Line
        if (!map.getLayer("constellation-core")) {
            map.addLayer({
                id: "constellation-core",
                type: "line",
                source: "constellation-source",
                layout: {
                    "line-join": "round",
                    "line-cap": "round"
                },
                paint: {
                    "line-color": "#ffffff",
                    "line-width": 1.5,
                    "line-opacity": 0.6,
                    "line-dasharray": [2, 4] // Dashed line for "constellation" look
                }
            });
        }
    };


    // --- Point Layers ---
    const ensureSource = () => {
        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, {
                type: "geojson",
                data: {
                    type: "FeatureCollection",
                    features: []
                },
                cluster: true,
                clusterMaxZoom: 14, // Max zoom level to cluster points
                clusterRadius: 50,  // Radius of each cluster when clustering points
            });
        }
    };

    const ensureLayers = () => {
        // --- CLUSTER LAYERS ---
        
        // 1. Cluster Circles
        if (!map.getLayer("clusters")) {
            map.addLayer({
                id: "clusters",
                type: "circle",
                source: sourceId,
                filter: ["has", "point_count"],
                paint: {
                    "circle-color": [
                        "step",
                        ["get", "point_count"],
                        "#ffffff",  // 0-4 memories: White
                        5,
                        "#fbbf24",  // 5-9 memories: Gold
                        10,
                        "#ef4444"   // 10+ memories: Red/Pink
                    ],
                    "circle-radius": [
                        "step",
                        ["get", "point_count"],
                        20,  // Small cluster
                        5,
                        30,  // Medium
                        10,
                        40   // Large
                    ],
                    "circle-opacity": 0.8,
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#000000"
                }
            });
        }

        // 2. Cluster Count Labels
        if (!map.getLayer("cluster-count")) {
            map.addLayer({
                id: "cluster-count",
                type: "symbol",
                source: sourceId,
                filter: ["has", "point_count"],
                layout: {
                    "text-field": "{point_count_abbreviated}",
                    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
                    "text-size": 12,
                },
                paint: {
                    "text-color": "#000000"
                }
            });
        }

        // --- UNCLUSTERED POINT LAYERS ---

        // Halo Effect (Outer Glow)
        if (!map.getLayer(haloLayerId)) {
            map.addLayer({
                id: haloLayerId,
                type: "circle",
                source: sourceId,
                filter: ["!", ["has", "point_count"]], // ONLY for unclustered points
                paint: {
                    "circle-radius": 12,
                    "circle-color": "#ffffff",
                    "circle-opacity": 0.4,
                    "circle-blur": 0.5,
                }
            });
        }

        // Core White Dot (or Gold if Locked)
        if (!map.getLayer(layerId)) {
            map.addLayer({
                id: layerId,
                type: "circle",
                source: sourceId,
                filter: ["!", ["has", "point_count"]], // ONLY for unclustered points
                paint: {
                    "circle-radius": [
                        "case",
                        ["boolean", ["feature-state", "hover"], false],
                        8, // Size when hovered
                        6  // Normal size
                    ],
                    "circle-color": [
                        "case",
                        ["boolean", ["get", "locked"], false],
                        "#fbbf24", // Gold for locked (amber-400)
                        "#ffffff"  // White for unlocked
                    ],
                    "circle-stroke-width": 2,
                    "circle-stroke-color": "#000000",
                }
            });
        }
    };

    ensureLineSource();
    ensureLineLayers();
    ensureSource();
    ensureLayers();

    // Interaction Handlers
    const handleClick = (e: any) => {
        const features = e.features;
        if (!features?.length) return;

        const feature = features[0];
        const clusterId = feature.properties.cluster_id;

        // If clicked on a cluster, zoom in
        if (clusterId) {
            const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
            source.getClusterExpansionZoom(clusterId).then((zoom) => {
                map.flyTo({
                    center: (feature.geometry as any).coordinates,
                    zoom: zoom,
                    speed: 1.5,
                    curve: 1
                });
            }).catch((err) => {
                console.error("Error getting cluster zoom:", err);
            });
            return;
        }

        // Otherwise handle single memory click (unclustered)
        const properties = feature.properties;
        const memoryId = properties.id;
        const memory = memoriesRef.current.find(m => m.id === memoryId);
        if (memory) {
            onMemoryClickRef.current(memory);
        }
    };

    const handleMouseEnterCluster = () => {
        map.getCanvas().style.cursor = 'pointer';
    };
    
    const handleMouseLeaveCluster = () => {
        map.getCanvas().style.cursor = '';
    };

    let hoveredStateId: string | number | null = null;
    const handleMouseEnter = (e: any) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features.length > 0) {
            if (hoveredStateId !== null) {
                map.setFeatureState(
                    { source: sourceId, id: hoveredStateId },
                    { hover: false }
                );
            }
            hoveredStateId = e.features[0].id;
            map.setFeatureState(
                { source: sourceId, id: hoveredStateId as string | number },
                { hover: true }
            );
        }
    };

    const handleMouseLeave = () => {
        map.getCanvas().style.cursor = '';
        if (hoveredStateId !== null) {
            map.setFeatureState(
                { source: sourceId, id: hoveredStateId },
                { hover: false }
            );
        }
        hoveredStateId = null;
    };

    map.on("click", layerId, handleClick);
    map.on("mouseenter", layerId, handleMouseEnter);
    map.on("mouseleave", layerId, handleMouseLeave);
    
    // Cluster Interaction
    map.on("click", "clusters", handleClick); // Use same handler, logic inside detects cluster
    map.on("mouseenter", "clusters", handleMouseEnterCluster);
    map.on("mouseleave", "clusters", handleMouseLeaveCluster);

    // Cleanup
    return () => {
        if (!map) return;
        
        // Safeguard against map being removed/destroyed already
        if (map.getCanvas && map.getCanvas()) {
            map.getCanvas().style.cursor = '';
        }

        try {
            map.off("click", layerId, handleClick);
            map.off("mouseenter", layerId, handleMouseEnter);
            map.off("mouseleave", layerId, handleMouseLeave);
            
            map.off("click", "clusters", handleClick); 
            map.off("mouseenter", "clusters", handleMouseEnterCluster);
            map.off("mouseleave", "clusters", handleMouseLeaveCluster);

            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getLayer(haloLayerId)) map.removeLayer(haloLayerId);
            if (map.getLayer("clusters")) map.removeLayer("clusters");
            if (map.getLayer("cluster-count")) map.removeLayer("cluster-count");
            if (map.getSource(sourceId)) map.removeSource(sourceId);
            
            // Remove line layers
            if (map.getLayer("constellation-core")) map.removeLayer("constellation-core");
            if (map.getLayer("constellation-glow")) map.removeLayer("constellation-glow");
            if (map.getSource("constellation-source")) map.removeSource("constellation-source");
        } catch (e) {
            console.warn("Map layer cleanup failed (map might be destroyed already):", e);
        }
    };
  }, [map, isLoaded]); 

  // 2. Update Data
  useEffect(() => {
    if (!map || !isLoaded) return;
    
    // Update Points
    const source = map.getSource(sourceId) as maplibregl.GeoJSONSource;
    if (source) {
        const geojson: FeatureCollection = {
            type: "FeatureCollection",
            features: memories.map((m) => {
                const isLocked = m.unlock_date ? new Date(m.unlock_date) > new Date() : false;
                return {
                    id: m.id, 
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [m.longitude, m.latitude],
                    },
                    properties: { 
                        id: m.id, 
                        title: m.location_name,
                        locked: isLocked 
                    },
                };
            }),
        };
        source.setData(geojson);
    }

    // Update Lines (Constellation)
    const lineSource = map.getSource("constellation-source") as maplibregl.GeoJSONSource;
    if (lineSource) {
        // Sort memories by date
        const sortedMemories = [...memories].sort((a, b) => 
            new Date(a.memory_date).getTime() - new Date(b.memory_date).getTime()
        );

        if (sortedMemories.length < 2) {
            lineSource.setData({ type: "FeatureCollection", features: [] });
            return;
        }

        const coordinates = sortedMemories.map(m => [m.longitude, m.latitude]);

        const lineGeoJSON: FeatureCollection = {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: coordinates
                },
                properties: {}
            }]
        };
        lineSource.setData(lineGeoJSON);
    }

  }, [map, isLoaded, memories]);

  return null;
}
