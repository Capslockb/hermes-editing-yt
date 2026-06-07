import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Floating right-rail TOC. Tracks the active section via IntersectionObserver
// and offers a "Back to top" button that appears once the user has scrolled
// past the hero. Hidden on mobile (lg:block).
//
// Sections are derived from the same IDs the nav links use; adding a new
// section means adding an entry here.
const SECTIONS = [
  { id: "how-it-works", label: "How" },
  { id: "features", label: "Features" },
  { id: "pipelines", label: "Pipelines" },
  { id: "tech", label: "Tools" },
  { id: "resources", label: "Resources" },
  { id: "install", label: "Install" },
];

export const SidebarTOC = () => {
  const [active, setActive] = useState<string>("");
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    // Track the active section by scanning which section's top edge is
    // closest to the viewport top. Using IntersectionObserver would be
    // cleaner but the section IDs are dynamic; this is robust enough.
    const handleScroll = () => {
      setShowTop(window.scrollY > 600);

      const scrollPos = window.scrollY + window.innerHeight * 0.25;
      let current = "";
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          current = id;
        }
      }
      setActive(current);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <>
      {/* Floating right-rail TOC. Hidden on small screens. */}
      <nav
        aria-label="Section navigation"
        className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col gap-1"
      >
        {SECTIONS.map(({ id, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className="group flex items-center gap-3 cursor-pointer"
              title={label}
            >
              <span
                className={`text-[11px] uppercase tracking-widest transition-all duration-200 ${
                  isActive
                    ? "text-white opacity-100 translate-x-0"
                    : "text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2"
                }`}
              >
                {label}
              </span>
              <span
                className={`block rounded-full transition-all duration-200 ${
                  isActive
                    ? "w-3 h-3 bg-[#915eff] shadow-[0_0_10px_#915eff]"
                    : "w-2 h-2 bg-white/20 group-hover:bg-white/60"
                }`}
              />
            </button>
          );
        })}
      </nav>

      {/* Back-to-top button. Slides in from below once the user scrolls. */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={scrollToTop}
            aria-label="Back to top"
            className="fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full bg-[#915eff] hover:bg-[#7a3dff] text-white text-[18px] font-bold shadow-lg shadow-[#915eff]/30 flex items-center justify-center transition-colors"
          >
            ↑
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
};
