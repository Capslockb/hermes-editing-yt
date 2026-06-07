import { motion } from "framer-motion";

import { RESOURCES } from "../constants";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { textVariant, fadeIn } from "../utils/motion";

type ResourceCardProps = {
  label: string;
  sub: string;
  href: string;
  icon: string;
};

const ResourceCard = ({ label, sub, href, icon }: ResourceCardProps) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noreferrer noopener"
    variants={fadeIn("up", "spring", 0.1, 0.5)}
    whileHover={{ y: -4 }}
    className="bg-tertiary p-5 sm:p-6 rounded-2xl border border-white/5 hover:border-[#915eff]/50 transition-all flex items-center gap-3 sm:gap-4 group"
  >
    <img
      src={icon}
      alt={label}
      className="w-9 h-9 sm:w-10 sm:h-10 object-contain opacity-80 group-hover:opacity-100 flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <div className="text-white font-bold text-[15px] sm:text-[16px] group-hover:text-[#915eff] transition-colors">
        {label}
      </div>
      <div className="text-secondary text-[12px] truncate">{sub}</div>
    </div>
    <div className="text-secondary group-hover:text-[#915eff] transition-colors text-[18px] flex-shrink-0">
      ↗
    </div>
  </motion.a>
);

export const Resources = () => {
  return (
    <SectionWrapper idName="resources">
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Jump in</p>
        <h2 className={styles.sectionHeadText}>Resources.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px] text-center sm:text-left"
      >
        Everything you need to read, run, fork, and file issues. All links
        open in a new tab.
      </motion.p>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto sm:mx-0">
        {RESOURCES.map((r) => (
          <ResourceCard key={r.label} {...r} />
        ))}
      </div>
    </SectionWrapper>
  );
};
