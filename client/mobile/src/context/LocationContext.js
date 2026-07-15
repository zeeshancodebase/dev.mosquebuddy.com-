import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getUserLocation } from "../lib/location";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [locationContext, setLocationContext] = useState(null);
  const [locationLabel, setLocationLabel] = useState("Set location");
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);

  // ── On app mount, try GPS silently once ──
  useEffect(() => {
    (async () => {
      const location = await getUserLocation();
      if (location) {
        setLocationContext({
          type: "gps",
          latitude: location.latitude,
          longitude: location.longitude,
          label: location.label || "Near you",
        });
        setLocationLabel(location.label || "Near you");
      }
      // If no GPS permission, locationContext stays null → screens prompt user to set location
    })();
  }, []);

  const selectLocation = useCallback((ctx) => {
    setLocationContext(ctx);
    setLocationLabel(ctx.label);
  }, []);

  const openLocationSheet = useCallback(() => setLocationSheetVisible(true), []);
  const closeLocationSheet = useCallback(() => setLocationSheetVisible(false), []);

  return (
    <LocationContext.Provider
      value={{
        locationContext,
        locationLabel,
        locationSheetVisible,
        selectLocation,
        openLocationSheet,
        closeLocationSheet,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return ctx;
}