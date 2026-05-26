"use client";

import { useEffect, useMemo, useRef } from "react";
import maplibregl, { Map, Popup } from "maplibre-gl";
import { formatNumber } from "@/lib/utils";

export interface CountryBubblePoint {
  country: string;
  countryName?: string;
  latitude: number;
  longitude: number;
  count?: number;
  minutes?: number;
}

interface CountryBubbleMapProps {
  data?: CountryBubblePoint[];
  metricLabel?: string;
  emptyLabel?: string;
}

const sourceId = "country-bubbles";
const circleLayerId = "country-bubble-circles";

const rasterStyle: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
    },
  },
  layers: [
    {
      id: "carto-base",
      type: "raster",
      source: "carto",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export default function CountryBubbleMap({
  data = [],
  metricLabel = "Views",
  emptyLabel = "No country statistics available.",
}: CountryBubbleMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const hasData = data.length > 0;

  const geojson = useMemo(() => {
    const maxValue = Math.max(...data.map((item) => Number(item.count || item.minutes || 0)), 1);

    return {
      type: "FeatureCollection" as const,
      features: data
        .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude))
        .map((item) => {
          const value = Number(item.count || item.minutes || 0);
          const radius = Math.max(8, Math.min(34, 8 + Math.sqrt(value / maxValue) * 26));

          return {
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [item.longitude, item.latitude],
            },
            properties: {
              code: item.country,
              name: item.countryName || item.country,
              value,
              radius,
              label: formatNumber(value),
            },
          };
        }),
    };
  }, [data]);

  const geojsonRef = useRef(geojson);
  const metricLabelRef = useRef(metricLabel);

  useEffect(() => {
    geojsonRef.current = geojson;
    metricLabelRef.current = metricLabel;
  }, [geojson, metricLabel]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: rasterStyle,
      center: [15, 22],
      zoom: 1.1,
      minZoom: 1,
      maxZoom: 5,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    map.on("load", () => {
      map.addSource(sourceId, {
        type: "geojson",
        data: geojsonRef.current,
      });

      map.addLayer({
        id: circleLayerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-radius": ["get", "radius"],
          "circle-color": "#ef4444",
          "circle-opacity": 0.7,
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });

      map.on("mouseenter", circleLayerId, (event) => {
        map.getCanvas().style.cursor = "pointer";
        const feature = event.features?.[0];
        const coordinates = (feature?.geometry as any)?.coordinates?.slice();
        const properties = feature?.properties as Record<string, string | number> | undefined;
        if (!coordinates || !properties) return;

        popupRef.current?.remove();
        const popupNode = document.createElement("div");
        popupNode.className = "country-bubble-popup-card text-xs text-gray-900";
        const title = document.createElement("strong");
        title.className = "block text-gray-950";
        title.textContent = String(properties.name || "");
        const detail = document.createElement("span");
        detail.className = "text-gray-700";
        detail.textContent = `${metricLabelRef.current}: ${formatNumber(Number(properties.value || 0))}`;
        popupNode.append(title, detail);
        popupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          className: "country-bubble-popup",
        })
          .setLngLat(coordinates)
          .setDOMContent(popupNode)
          .addTo(map);
      });

      map.on("mouseleave", circleLayerId, () => {
        map.getCanvas().style.cursor = "";
        popupRef.current?.remove();
      });
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const updateSource = () => {
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined;
      source?.setData(geojson);
    };

    if (map.isStyleLoaded()) updateSource();
    else map.once("load", updateSource);
  }, [geojson]);

  return (
    <div className="relative h-[360px] overflow-hidden rounded-md border bg-muted">
      <div ref={containerRef} className="h-full w-full" />
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 p-4 text-center text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}
