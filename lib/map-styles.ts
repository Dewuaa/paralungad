export const DARK_MATTER_STYLE = {
  "version": 8,
  "name": "Dark Matter",
  "metadata": { "maputnik:renderer": "mbgljs" },
  "sources": {
    "carto": {
      "type": "vector",
      "url": "https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json"
    }
  },
  "sprite": "https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/sprite",
  "glyphs": "https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf",
  "sky": {
      "sky-color": "#050505",
      "sky-horizon-blend": 0.5,
      "horizon-color": "#0a0a0a",
      "horizon-fog-blend": 0.5,
      "fog-color": "#242424",
      "fog-ground-blend": 0.4,
      "atmosphere-blend": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 1,
          10, 1,
          12, 0
      ]
  },
  "layers": [
    {
      "id": "background",
      "type": "background",
      "layout": { "visibility": "visible" },
      "paint": { "background-color": "#0e0e0e", "background-opacity": 1 }
    },
    {
      "id": "landcover",
      "type": "fill",
      "source": "carto",
      "source-layer": "landcover",
      "filter": [
        "any",
        ["==", "class", "wood"],
        ["==", "class", "grass"],
        ["==", "subclass", "recreation_ground"]
      ],
      "paint": {
        "fill-color": {
          "stops": [
            [8, "#0e0e0e"],
            [9, "#0e0e0e"],
            [11, "#0e0e0e"],
            [13, "#0e0e0e"],
            [15, "#0e0e0e"]
          ]
        },
        "fill-opacity": 1
      }
    },
    {
      "id": "park_national_park",
      "type": "fill",
      "source": "carto",
      "source-layer": "park",
      "minzoom": 9,
      "filter": ["all", ["==", "class", "national_park"]],
      "layout": { "visibility": "visible" },
      "paint": {
        "fill-color": {
          "stops": [
            [8, "#0e0e0e"],
            [9, "#0e0e0e"],
            [11, "#0e0e0e"],
            [13, "#0e0e0e"],
            [15, "#0e0e0e"]
          ]
        },
        "fill-opacity": 1,
        "fill-translate-anchor": "map"
      }
    },
    {
      "id": "park_nature_reserve",
      "type": "fill",
      "source": "carto",
      "source-layer": "park",
      "minzoom": 0,
      "filter": ["all", ["==", "class", "nature_reserve"]],
      "layout": { "visibility": "visible" },
      "paint": {
        "fill-color": {
          "stops": [
            [8, "#0e0e0e"],
            [9, "#0e0e0e"],
            [11, "#0e0e0e"],
            [13, "#0e0e0e"],
            [15, "#0e0e0e"]
          ]
        },
        "fill-antialias": true,
        "fill-opacity": {
          "stops": [
            [6, 0.7],
            [9, 0.9]
          ]
        }
      }
    },
    {
      "id": "landuse_residential",
      "type": "fill",
      "source": "carto",
      "source-layer": "landuse",
      "minzoom": 6,
      "filter": ["any", ["==", "class", "residential"]],
      "paint": {
        "fill-color": {
          "stops": [
            [5, "rgba(0, 0, 0, 0.5)"],
            [8, "rgba(0, 0, 0, 0.45)"],
            [9, "rgba(0, 0, 0, 0.4)"],
            [11, "rgba(0, 0, 0, 0.35)"],
            [13, "rgba(0, 0, 0, 0.3)"],
            [15, "rgba(0, 0, 0, 0.25)"],
            [16, "rgba(0, 0, 0, 0.15)"]
          ]
        },
        "fill-opacity": {
          "stops": [
            [6, 0.6],
            [9, 1]
          ]
        }
      }
    },
    {
      "id": "landuse",
      "type": "fill",
      "source": "carto",
      "source-layer": "landuse",
      "filter": ["any", ["==", "class", "cemetery"], ["==", "class", "stadium"]],
      "paint": {
        "fill-color": {
          "stops": [
            [8, "#0e0e0e"],
            [9, "#0e0e0e"],
            [11, "#0e0e0e"],
            [13, "#0e0e0e"],
            [15, "#0e0e0e"]
          ]
        }
      }
    },
    {
      "id": "waterway",
      "type": "line",
      "source": "carto",
      "source-layer": "waterway",
      "paint": {
        "line-color": "rgba(63, 90, 109, 1)",
        "line-width": {
          "stops": [
            [8, 0.5],
            [9, 1],
            [15, 2],
            [16, 3]
          ]
        }
      }
    },
    {
      "id": "boundary_county",
      "type": "line",
      "source": "carto",
      "source-layer": "boundary",
      "minzoom": 9,
      "maxzoom": 24,
      "filter": ["all", ["==", "admin_level", 6], ["==", "maritime", 0]],
      "paint": {
        "line-color": {
          "stops": [
            [4, "#222"],
            [5, "#222"],
            [6, "#2C353C"]
          ]
        },
        "line-width": {
          "stops": [
            [4, 0.5],
            [7, 1]
          ]
        },
        "line-dasharray": {
          "stops": [
            [6, [1]],
            [7, [2, 2]]
          ]
        }
      }
    },
    {
      "id": "boundary_state",
      "type": "line",
      "source": "carto",
      "source-layer": "boundary",
      "minzoom": 0,
      "maxzoom": 24,
      "filter": ["all", ["==", "admin_level", 4], ["==", "maritime", 0]],
      "layout": {
        "line-join": "round",
        "line-cap": "round"
      },
      "paint": {
        "line-color": {
          "stops": [
            [2, "#232323"],
            [4, "#2C353C"],
            [8, "#444"]
          ]
        },
        "line-width": {
          "stops": [
            [2, 0.5],
            [8, 1.5]
          ]
        },
        "line-dasharray": [2, 2, 6, 2],
        "line-opacity": {
          "stops": [
            [3, 0.5],
            [6, 1]
          ]
        }
      }
    },
    {
      "id": "boundary_country_z0-4",
      "type": "line",
      "source": "carto",
      "source-layer": "boundary",
      "minzoom": 0,
      "maxzoom": 5,
      "filter": ["all", ["==", "admin_level", 2], ["==", "maritime", 0]],
      "layout": {
        "line-cap": "round",
        "line-join": "round"
      },
      "paint": {
        "line-color": {
          "stops": [
            [1, "#444"],
            [3, "#444"],
            [5, "#333"],
            [6, "#333"]
          ]
        },
        "line-width": {
          "stops": [
            [1, 0.5],
            [3, 1],
            [5, 1.2],
            [6, 1.5]
          ]
        },
        "line-opacity": {
          "stops": [
            [3, 0.5],
            [6, 1]
          ]
        }
      }
    },
    {
        "id": "place_other",
        "type": "symbol",
        "source": "carto",
        "source-layer": "place",
        "minzoom": 8,
        "filter": [
            "all",
            ["==", "class", "hamlet"],
            ["==", "rank_max", 15]
        ],
        "layout": {
            "text-field": "{name_en}",
            "text-font": ["Metropolis Regular", "Noto Sans Regular"],
            "text-transform": "uppercase",
            "text-size": 9,
            "text-letter-spacing": 0.1,
            "text-max-width": 9
        },
        "paint": {
            "text-color": "#657683",
            "text-halo-width": 1,
            "text-halo-color": "#171717",
            "text-halo-blur": 1
        }
    },
    {
      "id": "place_suburb",
      "type": "symbol",
      "source": "carto",
      "source-layer": "place",
      "minzoom": 10,
      "maxzoom": 15,
      "filter": ["all", ["==", "class", "suburb"]],
      "layout": {
        "text-field": "{name_en}",
        "text-font": ["Metropolis Regular", "Noto Sans Regular"],
        "text-transform": "uppercase",
        "text-size": 9,
        "text-letter-spacing": 0.15,
        "text-max-width": 8
      },
      "paint": {
        "text-color": "#818E97",
        "text-halo-width": 1,
        "text-halo-color": "#171717",
        "text-halo-blur": 1
      }
    },
    {
      "id": "place_village",
      "type": "symbol",
      "source": "carto",
      "source-layer": "place",
      "minzoom": 10,
      "maxzoom": 15,
      "filter": ["all", ["==", "class", "village"]],
      "layout": {
        "text-field": "{name_en}",
        "text-font": ["Metropolis Regular", "Noto Sans Regular"],
        "text-transform": "uppercase",
        "text-size": 9,
        "text-letter-spacing": 0.15,
        "text-max-width": 8
      },
      "paint": {
        "text-color": "#818E97",
        "text-halo-width": 1,
        "text-halo-color": "#171717",
        "text-halo-blur": 1
      }
    },
    {
      "id": "place_town",
      "type": "symbol",
      "source": "carto",
      "source-layer": "place",
      "minzoom": 9,
      "maxzoom": 15,
      "filter": ["all", ["==", "class", "town"]],
      "layout": {
        "text-field": "{name_en}",
        "text-font": ["Metropolis Regular", "Noto Sans Regular"],
        "text-transform": "uppercase",
        "text-size": {
          "stops": [
            [9, 10],
            [12, 12]
          ]
        },
        "text-letter-spacing": 0.15,
        "text-max-width": 8
      },
      "paint": {
        "text-color": "#9ca7af",
        "text-halo-width": 1,
        "text-halo-color": "#0e0e0e",
        "text-halo-blur": 1
      }
    },
    {
      "id": "place_city",
      "type": "symbol",
      "source": "carto",
      "source-layer": "place",
      "minzoom": 5,
      "maxzoom": 13,
      "filter": ["all", ["==", "class", "city"]],
      "layout": {
        "text-field": "{name_en}",
        "text-font": ["Metropolis Regular", "Noto Sans Regular"],
        "text-transform": "uppercase",
        "text-size": {
          "stops": [
            [5, 12],
            [10, 16]
          ]
        },
        "text-letter-spacing": 0.15,
        "text-max-width": 8
      },
      "paint": {
        "text-color": "#d2d6d9",
        "text-halo-width": 1,
        "text-halo-color": "#0e0e0e",
        "text-halo-blur": 1
      }
    },
    {
      "id": "place_country_other",
      "type": "symbol",
      "source": "carto",
      "source-layer": "place",
      "maxzoom": 8,
      "filter": [
        "all",
        ["==", "class", "country"],
        [">=", "rank_max", 2]
      ],
      "layout": {
        "text-field": "{name_en}",
        "text-font": ["Metropolis Regular", "Noto Sans Regular"],
        "text-transform": "uppercase",
        "text-size": {
          "stops": [
            [1, 9],
            [7, 13]
          ]
        },
        "text-letter-spacing": 0.15,
        "text-max-width": 6
      },
      "paint": {
        "text-color": "#5b656d",
        "text-halo-width": 1,
        "text-halo-color": "#171717",
        "text-halo-blur": 1
      }
    },
    {
      "id": "place_country_major",
      "type": "symbol",
      "source": "carto",
      "source-layer": "place",
      "maxzoom": 6,
      "filter": [
        "all",
        ["==", "class", "country"],
        ["<", "rank_max", 2]
      ],
      "layout": {
        "text-field": "{name_en}",
        "text-font": ["Metropolis Regular", "Noto Sans Regular"],
        "text-transform": "uppercase",
        "text-size": {
          "stops": [
            [1, 10],
            [6, 14]
          ]
        },
        "text-letter-spacing": 0.15,
        "text-max-width": 6
      },
      "paint": {
        "text-color": "#768087",
        "text-halo-width": 1,
        "text-halo-color": "#171717",
        "text-halo-blur": 1
      }
    },
    {
        "id": "place_continent",
        "type": "symbol",
        "source": "carto",
        "source-layer": "place",
        "maxzoom": 1,
        "filter": ["all", ["==", "class", "continent"]],
        "layout": {
            "text-field": "{name_en}",
            "text-font": ["Metropolis Regular", "Noto Sans Regular"],
            "text-transform": "uppercase",
            "text-size": 13,
            "text-letter-spacing": 0.15,
            "text-max-width": 10
        },
        "paint": {
            "text-color": "#535f67",
            "text-halo-width": 1,
            "text-halo-color": "#171717",
            "text-halo-blur": 1
        }
    }
  ]
};
export const CUSTOM_GLOBE_STYLE = {
  "version": 8,
  "name": "Paraluman Custom",
  "metadata": { "maputnik:renderer": "mbgljs" },
  "sources": {
    "carto": {
      "type": "vector",
      "url": "https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json"
    }
  },
  "sprite": "https://demotiles.maplibre.org/styles/osm-bright-gl-style/sprite",
  "glyphs": "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  "sky": {
      "sky-color": "rgba(0, 0, 0, 0)", // Transparent "Space" to show stars behind
      "sky-horizon-blend": 0.5,
      "horizon-color": "rgba(0, 0, 0, 0)", // Transparent horizon
      "horizon-fog-blend": 0.5,
      "fog-color": "#2a2a2a", // Keep some fog for atmosphere
      "fog-ground-blend": 0.5,
      "atmosphere-blend": [
          "interpolate",
          ["linear"],
          ["zoom"],
          0, 1,
          10, 1,
          12, 0
      ]
  },
  "layers": [
    // 1. Background (Land Base)
    {
      "id": "background",
      "type": "background",
      "paint": {
        "background-color": "#1F2937" 
      }
    },
    // 2. Water (Oceans)
    {
      "id": "water",
      "type": "fill",
      "source": "carto",
      "source-layer": "water",
      "paint": {
        "fill-color": "#0B1026",
        "fill-opacity": 1
      }
    },
    // 3. Ground Texture Layers (Bottom)
    {
      "id": "land-parks",
      "type": "fill",
      "source": "carto",
      "source-layer": "park",
      "paint": {
        "fill-color": "#2D3748", 
        "fill-opacity": 0.3
      }
    },
    {
        "id": "land-use-detail", // MOVED UP: Draw this on the ground, BEFORE roads
        "type": "fill",
        "source": "carto",
        "source-layer": "landuse",
        "minzoom": 11,
        "filter": ["all", ["in", "class", "school", "hospital", "stadium", "cemetery"]],
        "paint": {
            "fill-color": "#232d3f", 
            "fill-opacity": 0.5
        }
    },
    // 4. Lines (Waterways, Boundaries, Roads)
    {
      "id": "waterway",
      "type": "line",
      "source": "carto",
      "source-layer": "waterway",
      "paint": {
        "line-color": "#0B1026",
        "line-width": 1
      }
    },
    {
      "id": "coastline",
      "type": "line",
      "source": "carto",
      "source-layer": "boundary",
      "filter": ["all", ["==", "admin_level", 2], ["==", "maritime", 0]],
      "paint": {
        "line-color": "#4B5563",
        "line-width": 1,
        "line-opacity": 0.8
      }
    },
    {
       "id": "boundary_provinces",
       "type": "line",
       "source": "carto",
       "source-layer": "boundary",
       "filter": ["all", ["==", "admin_level", 4]],
       "minzoom": 3,
       "paint": {
         "line-color": "#374151",
         "line-width": 0.5,
         "line-dasharray": [2, 1]
       }
    },
    // 4b. Roads - NOW ABOVE LAND USE
    {
        "id": "road_lines",
        "type": "line",
        "source": "carto",
        "source-layer": "transportation",
        "minzoom": 11,
        // Draw ALL roads without complex filtering first to ensure they exist
        "paint": {
            "line-color": "#9CA3AF",
            "line-width": ["interpolate", ["linear"], ["zoom"], 
                11, 1, 
                16, 3
            ]
        }
    },
    // 6. Labels & Icons (Topmost)
    // 5. 3D Buildings - Re-added
    {
        "id": "building-3d",
        "type": "fill-extrusion",
        "source": "carto",
        "source-layer": "building",
        "minzoom": 13,
        "paint": {
            "fill-extrusion-color": "#374151", 
            "fill-extrusion-height": ["coalesce", ["get", "render_height"], 20], // 20m Default
            "fill-extrusion-base": ["coalesce", ["get", "render_min_height"], 0],
            "fill-extrusion-opacity": 0.9,
            "fill-extrusion-vertical-gradient": true
        }
    },
    // 6. Labels & Icons (Text)
    {
        "id": "road_label",
        "type": "symbol",
        "source": "carto",
        "source-layer": "transportation_name", // Correct layer for text
        "minzoom": 13,
        "filter": ["all", ["has", "name"]], // Carto often uses 'name' or 'name_en'
        "layout": {
            "text-field": "{name}", 
            "text-font": ["Metropolis Regular", "Noto Sans Regular"],
            "text-size": 11,
            "symbol-placement": "line", 
            "text-max-angle": 30,
            "text-letter-spacing": 0.1
        },
        "paint": {
            "text-color": "#E5E7EB", 
            "text-halo-color": "#1F2937",
            "text-halo-width": 2
        }
    },
     {
        "id": "place_country",
        "type": "symbol",
        "source": "carto",
        "source-layer": "place",
        "filter": ["all", ["==", "class", "country"]], // Removed rank_max constraint
         "layout": {
            "text-field": "{name_en}",
            "text-font": ["Metropolis Regular", "Noto Sans Regular"],
            "text-transform": "uppercase",
            "text-size": 14,
            "text-letter-spacing": 0.1,
            "text-max-width": 10
        },
        "paint": {
            "text-color": "#E5E7EB", 
            "text-halo-color": "#111827", 
            "text-halo-width": 1.5
        }
    },
    {
        "id": "place_city",
        "type": "symbol",
        "source": "carto",
        "source-layer": "place",
        "minzoom": 4, 
        "filter": ["all", ["==", "class", "city"]],
        "layout": {
            "text-field": "{name_en}",
            "text-font": ["Metropolis Regular", "Noto Sans Regular"],
            "text-size": 12,
            "text-max-width": 8
        },
        "paint": {
            "text-color": "#D1D5DB",
            "text-halo-color": "#111827",
            "text-halo-width": 1.2
        }
    },
    {
        "id": "place_town",
        "type": "symbol",
        "source": "carto",
        "source-layer": "place",
        "minzoom": 6, 
        "filter": ["all", ["==", "class", "town"]],
        "layout": {
            "text-field": "{name_en}",
            "text-font": ["Metropolis Regular", "Noto Sans Regular"],
            "text-size": 10,
            "text-max-width": 8
        },
        "paint": {
            "text-color": "#9CA3AF",
            "text-halo-color": "#111827",
            "text-halo-width": 1
        }
    },
    {
        "id": "place_neighborhood",
        "type": "symbol",
        "source": "carto",
        "source-layer": "place",
        "minzoom": 12,
        "filter": ["all", ["in", "class", "neighborhood", "suburb"]],
        "layout": {
            "text-field": "{name_en}",
            "text-font": ["Metropolis Regular", "Noto Sans Regular"],
            "text-transform": "uppercase",
            "text-size": 11,
            "text-max-width": 8
        },
        "paint": {
            "text-color": "#9CA3AF",
            "text-halo-color": "#111827",
            "text-halo-width": 1
        }
    },
    {
        "id": "place_poi_badge",
        "type": "circle",
        "source": "carto",
        "source-layer": "poi",
        "minzoom": 13,
        "filter": ["all", ["has", "name_en"]],
        "paint": {
            "circle-radius": 10,
            "circle-color": "#FBBF24", // GOLD Background
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#FFFFFF", 
            "circle-opacity": 0.9
        }
    },
    {
        "id": "place_poi",
        "type": "symbol",
        "source": "carto",
        "source-layer": "poi",
        "minzoom": 13,
        "filter": ["all", ["has", "name_en"]],
        "layout": {
            "text-field": "{name_en}",
            "text-font": ["Metropolis Regular", "Noto Sans Regular"],
            "text-size": 10,
            "text-max-width": 8,
            "text-offset": [0, 1.8], 
            "text-anchor": "top",
            "icon-image": [
                "match",
                ["get", "class"],
                "school", "school_11",
                "hospital", "hospital_11",
                "restaurant", "restaurant_11",
                "fast_food", "fast_food_11",
                "cafe", "cafe_11",
                "bar", "bar_11",
                "bank", "bank_11",
                "library", "library_11",
                "cinema", "cinema_11",
                "pharmacy", "pharmacy_11",
                "park", "park_11",
                "stadium", "pitch_11",
                "marker_11"
            ],
            "icon-size": 1,
            "icon-allow-overlap": true
        },
        "paint": {
            "text-color": "#D1D5DB",
            "text-halo-color": "#111827",
            "text-halo-width": 1,
            "icon-color": "#000000", 
            "icon-opacity": 1
        }
    }
  ]
};
