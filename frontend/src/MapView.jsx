import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapView({ sites = [], onPolygonCreated }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const onPolygonCreatedRef = useRef(onPolygonCreated);

  useEffect(() => {
    onPolygonCreatedRef.current = onPolygonCreated;
  }, [onPolygonCreated]);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [78.9629, 20.5937],
      zoom: 4.5,
    });

    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });

    map.current.addControl(draw.current, "top-left");

    map.current.on("draw.create", (event) => {
      const geometry = event.features[0]?.geometry;

      if (geometry) {
        onPolygonCreatedRef.current(geometry);
      }
    });

    map.current.on("load", () => {
      console.log("MAPBOX MAP LOADED SUCCESSFULLY");
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    const addSites = () => {
      const features = sites
        .filter((site) => site.geometry)
        .map((site) => ({
          type: "Feature",
          properties: {
            id: site.id,
            name: site.name,
          },
          geometry: site.geometry,
        }));

      const geojson = {
        type: "FeatureCollection",
        features,
      };

      if (map.current.getSource("sites")) {
        map.current.getSource("sites").setData(geojson);
        return;
      }

      map.current.addSource("sites", {
        type: "geojson",
        data: geojson,
      });

      map.current.addLayer({
        id: "site-fill",
        type: "fill",
        source: "sites",
        paint: {
          "fill-opacity": 0.35,
        },
      });

      map.current.addLayer({
        id: "site-outline",
        type: "line",
        source: "sites",
        paint: {
          "line-width": 3,
        },
      });

      map.current.on("click", "site-fill", (event) => {
        const site = event.features[0]?.properties;

        if (!site) return;

        new mapboxgl.Popup()
          .setLngLat(event.lngLat)
          .setHTML(`<strong>${site.name}</strong>`)
          .addTo(map.current);
      });

      map.current.on("mouseenter", "site-fill", () => {
        map.current.getCanvas().style.cursor = "pointer";
      });

      map.current.on("mouseleave", "site-fill", () => {
        map.current.getCanvas().style.cursor = "";
      });
    };

    if (map.current.isStyleLoaded()) {
      addSites();
    } else {
      map.current.once("load", addSites);
    }
  }, [sites]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "500px",
        minHeight: "500px",
        borderRadius: "12px",
      }}
    />
  );
}

export default MapView;
