"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { DEFAULT_LOCATION } from "@/lib/neighborhoods";

export type LocationStatus = "unset" | "granted" | "manual" | "denied";

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

interface LocationState {
  status: LocationStatus;
  coords: LocationCoords;
  label: string;
}

interface LocationContextValue extends LocationState {
  /** Opens the consent dialog if the user hasn't decided yet; no-op otherwise. */
  ensureConsent: () => void;
  requestBrowserLocation: () => void;
  setManualLocation: (coords: LocationCoords, label: string) => void;
  dismiss: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

const STORAGE_KEY = "bitemap-location";

const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LocationState>({
    status: "unset",
    coords: { latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude },
    label: DEFAULT_LOCATION.label,
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        // Reading localStorage only after mount avoids an SSR/client hydration mismatch.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setState(JSON.parse(raw));
      } catch {
        // ignore malformed storage
      }
    }
  }, []);

  const persist = useCallback((next: LocationState) => {
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const requestBrowserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      persist({ ...state, status: "denied" });
      setDialogOpen(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        persist({
          status: "granted",
          coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude },
          label: "Current location",
        });
        setDialogOpen(false);
      },
      () => {
        persist({ ...state, status: "denied" });
        setDialogOpen(false);
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }, [state, persist]);

  const setManualLocation = useCallback(
    (coords: LocationCoords, label: string) => {
      persist({ status: "manual", coords, label });
      setDialogOpen(false);
    },
    [persist]
  );

  const dismiss = useCallback(() => {
    persist({ ...state, status: state.status === "unset" ? "denied" : state.status });
    setDialogOpen(false);
  }, [state, persist]);

  const ensureConsent = useCallback(() => {
    if (state.status === "unset") setDialogOpen(true);
  }, [state.status]);

  return (
    <LocationContext.Provider
      value={{
        ...state,
        ensureConsent,
        requestBrowserLocation,
        setManualLocation,
        dismiss,
        dialogOpen,
        setDialogOpen,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
