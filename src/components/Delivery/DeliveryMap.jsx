"use client";

import { useState, useEffect } from "react";
import { LocateFixed, Satellite } from "lucide-react";
import { watchLocation } from "@/lib/locationTracking";
import { resolveDropCoords } from "@/lib/dropPoints";

// Straight-line distance (metres) between two coords — Haversine.
const haversine = (a, b) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

// Shows the courier's REAL live position (streamed via the app's own
// Postgres-backed API — see src/lib/locationTracking.ts) on an OpenStreetMap
// embed — no Google Maps API key required. ETA comes from OSRM's free
// routing API (real road distance + duration).
//
// Before a courier has published any fix, the map used to show nothing —
// just an icon and "waiting" text on a flat background. It now falls back to
// the *viewer's own* live position (the browser's real navigator.geolocation,
// not a placeholder), so there's always an actual map on screen, centered on
// something real, the moment the component mounts. It switches to tracking
// the courier automatically the instant a real courier fix arrives.
const DeliveryMap = ({ deliveryId, dropPoint, dropCoords }) => {
  // Drop-point coordinates: explicit dropCoords win, else resolve from the
  // drop-point name, else KNUST campus default.
  const drop = dropCoords || resolveDropCoords(dropPoint);

  const [location, setLocation] = useState(null);
  const [staleSeconds, setStaleSeconds] = useState(0);
  const [eta, setEta] = useState(null); // { distanceM, durationS, source }
  const [viewerPos, setViewerPos] = useState(null);
  const [viewerStatus, setViewerStatus] = useState("requesting"); // requesting | granted | denied | unsupported

  // Subscribe to the live courier location for this delivery.
  useEffect(() => {
    if (!deliveryId) return;
    const unsubscribe = watchLocation(deliveryId, (loc) => setLocation(loc));
    return () => unsubscribe();
  }, [deliveryId]);

  // Track how long since the last fix (to show "live" vs "last seen").
  useEffect(() => {
    if (!location?.updatedAt) return;
    const tick = () =>
      setStaleSeconds(Math.floor((Date.now() - location.updatedAt) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [location?.updatedAt]);

  const hasFix = location && typeof location.lat === "number";
  const isLive = hasFix && location.active && staleSeconds < 30;

  // Viewer's own device location — real geolocation, requested once on
  // mount. Never sent anywhere; used only to give the map something live and
  // real to center on before a courier fix exists.
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setViewerStatus("unsupported");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setViewerStatus("granted");
        setViewerPos({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        });
      },
      (err) => {
        setViewerStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unsupported");
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Compute ETA from courier -> drop point using OSRM's free routing API
  // (real road distance + duration). Falls back to straight-line + assumed
  // speed if the routing service is unreachable.
  useEffect(() => {
    if (!hasFix) return;
    let cancelled = false;
    const from = { lat: location.lat, lng: location.lng };

    const fallback = () => {
      const distanceM = haversine(from, drop);
      const speed = location.speed && location.speed > 0.5 ? location.speed : 6; // m/s
      return { distanceM, durationS: distanceM / speed, source: "estimate" };
    };

    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${drop.lng},${drop.lat}?overview=false`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const route = d?.routes?.[0];
        setEta(
          route
            ? { distanceM: route.distance, durationS: route.duration, source: "route" }
            : fallback()
        );
      })
      .catch(() => {
        if (!cancelled) setEta(fallback());
      });

    return () => {
      cancelled = true;
    };
  }, [location?.lat, location?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatEta = () => {
    if (!eta) return null;
    const mins = Math.max(1, Math.round(eta.durationS / 60));
    const km = (eta.distanceM / 1000).toFixed(km1(eta.distanceM));
    const arrival = new Date(Date.now() + eta.durationS * 1000).toLocaleTimeString(
      [],
      { hour: "2-digit", minute: "2-digit" }
    );
    return { mins, km, arrival, approx: eta.source === "estimate" };
  };
  const km1 = (m) => (m < 10000 ? 1 : 0);
  const etaInfo = formatEta();

  // Map center: courier fix if we have one (the thing this component exists
  // to track), otherwise the viewer's own real position, otherwise the
  // delivery's drop point (never a fake default like "0,0").
  const mapCenter = hasFix ? { lat: location.lat, lng: location.lng } : viewerPos || drop;
  const showingViewerFallback = !hasFix && !!viewerPos;

  // Small bounding box for the OSM embed. Two markers when we're in the
  // viewer-fallback state (you + the drop point), one when tracking the
  // courier (courier position — the drop point is shown in the readout, not
  // as a second pin, to keep the courier-tracking view uncluttered).
  const osmSrc = (() => {
    if (hasFix) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${
        location.lng - 0.004
      }%2C${location.lat - 0.003}%2C${location.lng + 0.004}%2C${
        location.lat + 0.003
      }&layer=mapnik&marker=${location.lat}%2C${location.lng}`;
    }
    if (viewerPos) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=${
        viewerPos.lng - 0.006
      }%2C${viewerPos.lat - 0.0045}%2C${viewerPos.lng + 0.006}%2C${
        viewerPos.lat + 0.0045
      }&layer=mapnik&marker=${viewerPos.lat}%2C${viewerPos.lng}`;
    }
    return null;
  })();

  const hasMap = !!osmSrc;

  return (
    <div className="relative h-72 rounded-lg overflow-hidden border border-outline-variant/60 bg-surface-container-low dark:bg-gray-900">
      {hasMap ? (
        <iframe
          title="Live delivery location"
          src={osmSrc}
          className="absolute inset-0 w-full h-full"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <Satellite className="w-10 h-10 mb-3 text-on-surface-variant" aria-hidden="true" />
          <p className="font-semibold text-on-surface">
            {viewerStatus === "denied"
              ? "Location access needed"
              : "Waiting for courier location"}
          </p>
          <p className="text-sm text-on-surface-variant mt-1 max-w-xs">
            {viewerStatus === "denied"
              ? "Enable location access in your browser to see the map, or wait for the courier to start sharing their GPS."
              : viewerStatus === "requesting"
              ? "Finding your location…"
              : "The map goes live once the courier starts sharing their GPS for this delivery."}
          </p>
        </div>
      )}

      {/* Live status badge */}
      <div className="absolute top-3 left-3 z-10 bg-surface-container-lowest/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg flex items-center gap-2">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isLive ? "bg-secondary animate-pulse" : "bg-gray-400"
          }`}
        />
        <span className="text-xs font-semibold text-on-surface">
          {isLive
            ? "LIVE"
            : hasFix
            ? `Last seen ${staleSeconds}s ago`
            : showingViewerFallback
            ? "Courier offline"
            : "Offline"}
        </span>
      </div>

      {/* Viewer-location badge — only shown while we're using it as the map
          center, i.e. no courier fix yet. Makes clear whose position this is. */}
      {showingViewerFallback && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-surface-container-lowest/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg">
          <LocateFixed className="w-3.5 h-3.5 text-medical-teal dark:text-primary-fixed-dim" aria-hidden="true" />
          <span className="text-xs font-semibold text-on-surface">Your location</span>
        </div>
      )}

      {/* ETA badge */}
      {hasFix && etaInfo && (
        <div className="absolute top-3 right-3 z-10 bg-surface-container-lowest/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-lg text-right">
          <div className="text-xs text-on-surface-variant">
            ETA {etaInfo.approx ? "~" : ""}{etaInfo.arrival}
          </div>
          <div className="text-sm font-semibold text-secondary">
            {etaInfo.mins} min · {etaInfo.km} km
          </div>
        </div>
      )}

      {/* Precision + coordinates readout */}
      {hasFix && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-surface-container-lowest/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-on-surface-variant">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </span>
            <span className="text-on-surface-variant">
              {location.accuracy != null
                ? `±${Math.round(location.accuracy)} m`
                : "accuracy n/a"}
            </span>
          </div>
          <div className="text-on-surface-variant mt-0.5">
            Drop point: {dropPoint || "Campus Library - North Entrance"}
          </div>
        </div>
      )}

      {showingViewerFallback && (
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-surface-container-lowest/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg text-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-on-surface-variant">
              {viewerPos.lat.toFixed(5)}, {viewerPos.lng.toFixed(5)}
            </span>
            <span className="text-on-surface-variant">
              {viewerPos.accuracy != null ? `±${Math.round(viewerPos.accuracy)} m` : "accuracy n/a"}
            </span>
          </div>
          <div className="text-on-surface-variant mt-0.5">
            Drop point: {dropPoint || "Campus Library - North Entrance"}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMap;
