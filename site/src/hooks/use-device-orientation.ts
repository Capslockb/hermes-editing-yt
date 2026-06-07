import { useEffect, useState } from "react";

// Device orientation hook for mobile gyro-driven parallax.
// Returns beta (front/back tilt) and gamma (left/right tilt) in degrees,
// or null if the API is unavailable / permission not granted.
//
// iOS 13+ requires explicit permission via DeviceOrientationEvent.requestPermission().
// On Android, no permission is needed.
export const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState<{
    beta: number; // front-back (-180..180)
    gamma: number; // left-right (-90..90)
    granted: boolean;
  } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // iOS 13+ requires user gesture to request permission.
    const requestIfNeeded = async () => {
      const cls = (
        window as unknown as {
          DeviceOrientationEvent?: {
            requestPermission?: () => Promise<"granted" | "denied">;
          };
        }
      ).DeviceOrientationEvent;
      if (cls?.requestPermission) {
        try {
          const result = await cls.requestPermission();
          if (result !== "granted") return;
        } catch {
          return;
        }
      }
      startListening();
    };

    const startListening = () => {
      const handler = (e: DeviceOrientationEvent) => {
        if (e.beta === null || e.gamma === null) return;
        setOrientation({
          beta: e.beta,
          gamma: e.gamma,
          granted: true,
        });
      };
      window.addEventListener("deviceorientation", handler, { passive: true });
      return () => window.removeEventListener("deviceorientation", handler);
    };

    // Try to start immediately (Android); fall back to gesture
    // (iOS) on first user interaction.
    const stopImmediate = startListening();
    if (stopImmediate) return stopImmediate;

    const onFirstTap = () => {
      requestIfNeeded();
      window.removeEventListener("touchstart", onFirstTap);
      window.removeEventListener("click", onFirstTap);
    };
    window.addEventListener("touchstart", onFirstTap, { once: true, passive: true });
    window.addEventListener("click", onFirstTap, { once: true });
    return () => {
      window.removeEventListener("touchstart", onFirstTap);
      window.removeEventListener("click", onFirstTap);
    };
  }, []);

  return orientation;
};
