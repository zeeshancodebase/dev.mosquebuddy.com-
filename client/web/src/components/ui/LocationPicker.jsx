"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Link2, MapPinned } from "lucide-react";

const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 }; // India center fallback

async function loadGoogleMapsScript() {
  if (typeof window === "undefined") return;
  if (window.google?.maps) return;
  if (document.getElementById("google-maps-script")) {
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (window.google?.maps) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
    return;
  }
  await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function LocationPicker({ latitude, longitude, onChange }) {
  const [mode, setMode] = useState(null); // 'gps' | 'link' | 'pin' | null
  const [loading, setLoading] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const mapDivRef = useRef(null);
  const gpsMapDivRef = useRef(null);

  const hasCoords =
    latitude &&
    longitude &&
    !isNaN(parseFloat(latitude)) &&
    !isNaN(parseFloat(longitude));

  // ── GPS ──
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      alert("Geolocation isn't supported in this browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onChange({
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
        setLoading(false);
      },
      () => {
        alert(
          "Couldn't get your location. Please allow location access or try another method.",
        );
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  // ── Maps link — reuses the same backend endpoint as the mobile app ──
  //   const handleResolveLink = async () => {
  //     if (!linkInput.trim()) return;
  //     setLoading(true);
  //     try {
  //       // TODO: swap for your existing API client if you have one (axios instance, etc.)
  //       const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/utils/resolve-maps-link`, {
  //         method: "POST",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //         body: JSON.stringify({ url: linkInput.trim() }),
  //       });
  //       const json = await res.json();
  //       if (!res.ok) throw new Error(json.message || "Could not resolve link.");
  //       onChange({
  //         latitude: json.data.latitude.toFixed(6),
  //         longitude: json.data.longitude.toFixed(6),
  //         googleMapsLink: linkInput.trim(), // link itself is preserved as-is
  //       });
  //     } catch (err) {
  //       alert(err.message || "Couldn't read that link. Try dropping a pin instead.");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  // ── Pin drop ──
  useEffect(() => {
    if (mode !== "pin" && mode !== "gps") return;

    let cancelled = false;

    loadGoogleMapsScript().then(() => {
      if (cancelled) return;

      const targetRef =
        mode === "gps" ? gpsMapDivRef.current : mapDivRef.current;

      if (!targetRef) return;

      const center = hasCoords
        ? {
            lat: parseFloat(latitude),
            lng: parseFloat(longitude),
          }
        : DEFAULT_CENTER;

      const map = new window.google.maps.Map(targetRef, {
        center,
        zoom: hasCoords ? 16 : 5,
      });

      const marker = new window.google.maps.Marker({
        position: center,
        map,
        draggable: mode === "pin",
      });

      if (mode === "pin") {
        const emitPosition = (pos) =>
          onChange({
            latitude: pos.lat().toFixed(6),
            longitude: pos.lng().toFixed(6),
          });

        marker.addListener("dragend", () => {
          emitPosition(marker.getPosition());
        });

        map.addListener("click", (e) => {
          marker.setPosition(e.latLng);
          emitPosition(e.latLng);
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mode, latitude, longitude]);

  const tabClass = (active) =>
    `px-3 py-1.5 text-sm rounded-lg border transition-colors ${
      active
        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
        : "border-gray-300 text-gray-600 hover:bg-gray-50"
    }`;

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-gray-700">Coordinates</label>

      {hasCoords && (
        <div className="px-3.5 py-2.5 rounded-lg text-sm text-emerald-700 bg-emerald-50 border border-emerald-200">
          ✓ Set: {parseFloat(latitude).toFixed(5)},{" "}
          {parseFloat(longitude).toFixed(5)}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("gps")}
          className={tabClass(mode === "gps")}
        >
          <span className="flex items-center gap-1.5">
            <LocateFixed size={16} />
            Use my location
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={tabClass(mode === "link")}
        >
          <span className="flex items-center gap-1.5">
            <Link2 size={16} />
            Paste Maps link
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("pin")}
          className={tabClass(mode === "pin")}
        >
          <span className="flex items-center gap-1.5">
            <MapPinned size={16} />
            Drop a pin
          </span>
        </button>
      </div>

      {mode === "gps" && (
        <div className="flex flex-col gap-3">
          {hasCoords && (
            <div
              ref={gpsMapDivRef}
              className="w-full h-64 rounded-lg border border-gray-300"
            />
          )}

          <button
            type="button"
            onClick={handleUseGPS}
            disabled={loading}
            className="self-start px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg disabled:opacity-60"
          >
            <span className="flex items-center gap-1.5">
              <LocateFixed size={16} />
              {loading
                ? "Getting location..."
                : hasCoords
                  ? "Refresh Current Location"
                  : "Use Current Location"}
            </span>
          </button>
        </div>
      )}

      {mode === "link" && (
        // <div className="flex flex-col gap-2">
        //   <input
        //     type="text"
        //     placeholder="https://maps.app.goo.gl/..."
        //     value={linkInput}
        //     onChange={(e) => setLinkInput(e.target.value)}
        //     className="px-3.5 py-2.5 text-sm rounded-lg border border-gray-300"
        //   />
        //   <button
        //     type="button"
        //     // onClick={handleResolveLink}
        //     disabled={loading}
        //     className="self-start px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg disabled:opacity-60"
        //   >
        //     {loading ? "Extracting..." : "Extract Location"}
        //   </button>
        // </div>
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500">
            Paste the Maps link in the field below. 👇
          </p>
        </div>
      )}

      {mode === "pin" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-gray-500">
            Drag the pin or tap on the map to set the precise mosque location.
          </p>

          <div
            ref={mapDivRef}
            className="w-full h-64 rounded-lg border border-gray-300"
          />
        </div>
      )}
    </div>
  );
}
