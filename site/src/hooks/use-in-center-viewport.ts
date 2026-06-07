import { useEffect, useState, useRef } from "react";

// Returns true when the element is in the central 30% of the viewport
// (vertically). Used to drive "rotate when centered" animations on the
// 3D hero scene. The hero is technically always on screen, so this is
// more about preventing the rotation from running when the user has
// scrolled past it.
export const useInCenterViewport = <T extends HTMLElement = HTMLElement>(
  threshold = 0.3,
) => {
  const ref = useRef<T | null>(null);
  const [inCenter, setInCenter] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // inCenter is true when the element's center falls within the
        // central `threshold` fraction of the viewport.
        const rect = entry.boundingClientRect;
        const viewportH = window.innerHeight;
        const center = rect.top + rect.height / 2;
        const viewportCenter = viewportH / 2;
        const distance = Math.abs(center - viewportCenter);
        const withinThreshold = distance < viewportH * threshold;
        setInCenter(entry.isIntersecting && withinThreshold);
      },
      {
        // Track sub-pixel movement so we can measure center distance.
        threshold: [0, 0.1, 0.5, 0.9, 1.0],
      },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, inCenter] as const;
};
