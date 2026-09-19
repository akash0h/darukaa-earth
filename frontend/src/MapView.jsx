import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

const token = import.meta.env.VITE_MAPBOX_TOKEN;

mapboxgl.accessToken = token;

function MapView({ onPolygonCreated }) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    console.log("Mapbox token exists:", !!token);
    console.log("Map container:", mapContainer.current);

    if (!token) {
      console.error("MAPBOX TOKEN IS MISSING");
      return;
    }

    if (map.current) return;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/satellite-streets-v12",
        center: [78.9629, 20.5937],
        zoom: 4.5,
      });

      map.current.on("load", () => {
        console.log("MAPBOX MAP LOADED SUCCESSFULLY");
      });

      map.current.on("error", (event) => {
        console.error("MAPBOX ERROR:", event);
      });

      const draw = new MapboxDraw({
        displayControlsDefault: false,
        controls: {
          polygon: true,
          trash: true,
        },
      });

      map.current.addControl(draw, "top-left");

      map.current.on("draw.create", (event) => {
        onPolygonCreated(event.features[0].geometry);
      });
    } catch (error) {
      console.error("MAP INITIALIZATION ERROR:", error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "500px",
        minHeight: "500px",
        background: "#ddd",
      }}
    />
  );
}

export default MapView;