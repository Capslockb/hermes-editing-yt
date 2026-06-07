import { motion } from "framer-motion";

import { ComputersCanvas } from "./canvas";
import { styles } from "../styles";
import { cn } from "../utils/lib";

// Hero
export const Hero = () => {
  return (
    <section className="relative w-full h-screen mx-auto">
      <div
        className={cn(
          styles.paddingX,
          // Mobile: stack the bullet above the title and center everything.
          // Desktop (sm+): restore the bullet+line column on the left, with
          // the title sitting to its right, top-left of the section.
          "absolute inset-0 top-[120px] max-w-7xl mx-auto flex flex-col sm:flex-row items-center sm:items-start justify-center sm:justify-start gap-3 sm:gap-5",
        )}
      >
        {/* Title */}
        <div className="flex flex-col items-center sm:items-center mt-0 sm:mt-5 order-2 sm:order-1">
          <div className="w-5 h-5 rounded-full bg-[#915eff] hidden sm:block" />
          <div className="hidden sm:block w-1 sm:h-80 h-40 violet-gradient" />
        </div>

        {/* About Me */}
        <div className="order-1 sm:order-2 w-full sm:w-auto flex flex-col items-center sm:items-start">
          <h1 className={cn(styles.heroHeadText, "text-white text-[32px] xs:text-[40px] sm:text-[60px] lg:text-[80px]")}>
            <span className="text-[#915eff]">hermes-editing-yt</span>
          </h1>
          <p className={cn(styles.heroSubText, "mt-2 text-white-100 text-[14px] xs:text-[16px] sm:text-[26px] lg:text-[30px]")}>
            <span className="block">Subtitle-driven auto video editor.</span>
            <span className="block">Local GPU. Hermes MCP plugin.</span>
          </p>
        </div>
      </div>

      {/* Computer Model */}
      <ComputersCanvas />

      {/* Scroll to about section */}
      <div className="absolute xs:bottom-10 bottom-32 w-full flex justify-center items-center">
        <a href="#about">
          <div className="w-[35px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2">
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-3 h-3 rounded-full bg-secondary mb-1"
            />
          </div>
        </a>
      </div>
    </section>
  );
};
