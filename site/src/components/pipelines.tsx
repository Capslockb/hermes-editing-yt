import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

import { PIPELINES } from "../constants";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { textVariant, fadeIn } from "../utils/motion";

type PipelineCardProps = {
  name: string;
  tagline: string;
  description: string;
  command: string;
  href: string;
};

const PipelineCard = ({
  name,
  tagline,
  description,
  command,
  href,
}: PipelineCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success(`${name} command copied`, { duration: 2000 });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed — select manually");
    }
  };

  return (
    <motion.div
      variants={fadeIn("up", "spring", 0.1, 0.6)}
      className="bg-tertiary p-6 rounded-2xl w-full border border-white/5 hover:border-[#915eff]/40 transition-colors flex flex-col"
    >
      <div className="flex items-center justify-between mb-3">
        <code className="text-accent-cyan font-mono text-[18px] font-bold">
          {name}
        </code>
        <span className="text-[11px] uppercase tracking-widest text-secondary">
          {tagline}
        </span>
      </div>
      <p className="text-secondary text-[14px] leading-[22px] mb-4 flex-1">
        {description}
      </p>
      <div className="bg-black-200 rounded-lg p-3 font-mono text-[12px] mb-4 overflow-x-auto">
        <pre className="text-white/90 whitespace-pre-wrap break-all">
          {command}
        </pre>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 bg-[#915eff] hover:bg-[#7a3dff] text-white text-[13px] font-semibold py-2 rounded-md transition"
        >
          {copied ? "Copied" : "Copy command"}
        </button>
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[13px] font-semibold py-2 rounded-md transition text-center"
        >
          View code ↗
        </a>
      </div>
    </motion.div>
  );
};

export const Pipelines = () => {
  return (
    <SectionWrapper idName="pipelines">
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Three modes</p>
        <h2 className={styles.sectionHeadText}>Pipelines.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        Pick the depth of automation. <code className="text-accent-cyan">automark</code>{" "}
        plans without rendering — useful for review.{" "}
        <code className="text-accent-cyan">autocut</code> slices an existing SRT.{" "}
        <code className="text-accent-cyan">autoedit</code> does the full pipeline.
      </motion.p>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        {PIPELINES.map((p) => (
          <PipelineCard key={p.name} {...p} />
        ))}
      </div>
    </SectionWrapper>
  );
};
