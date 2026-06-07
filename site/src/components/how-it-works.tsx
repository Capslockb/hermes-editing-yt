import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";

import { HOW_IT_WORKS } from "../constants";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { textVariant, fadeIn } from "../utils/motion";

// One numbered step card. The "Copy" button copies the command to the
// clipboard and fires a sonner toast for confirmation — that gives the
// page real clickability without depending on a chat backend.
type StepProps = {
  step: number;
  title: string;
  summary: string;
  command: string;
  href: string;
};

const Step = ({ step, title, summary, command, href }: StepProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: command,
        duration: 3000,
      });
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed — select and copy manually");
    }
  };

  return (
    <motion.div
      variants={fadeIn("right", "spring", step * 0.15, 0.6)}
      className="bg-black-200 p-6 rounded-2xl w-full border border-white/5 hover:border-[#915eff]/40 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#915eff]/15 border border-[#915eff]/40 flex items-center justify-center">
          <span className="text-[#915eff] font-black text-[20px]">
            {step.toString().padStart(2, "0")}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-[20px] mb-2">{title}</h3>
          <p className="text-secondary text-[15px] leading-[24px] mb-4">
            {summary}
          </p>
          <div className="relative bg-tertiary rounded-lg p-3 font-mono text-[13px] overflow-x-auto">
            <pre className="text-accent-cyan whitespace-pre-wrap break-all pr-16">
              {command}
            </pre>
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={handleCopy}
                title="Copy command"
                className="bg-[#915eff] hover:bg-[#7a3dff] text-white text-[11px] font-semibold px-3 py-1 rounded-md transition"
              >
                {copied ? "Copied" : "Copy"}
              </button>
              <a
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                title="View source"
                className="bg-white/5 hover:bg-white/10 text-white text-[11px] font-semibold px-3 py-1 rounded-md transition"
              >
                Code ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export const HowItWorks = () => {
  return (
    <SectionWrapper idName="how-it-works">
      <motion.div variants={textVariant()}>
        <p className={styles.sectionSubText}>Walkthrough</p>
        <h2 className={styles.sectionHeadText}>How it works.</h2>
      </motion.div>

      <motion.p
        variants={fadeIn("", "", 0.1, 1)}
        className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]"
      >
        Four steps from a raw recording to a published cut. Each card has a
        copy-pasteable command — paste it into any Hermes chat to drive the
        pipeline, or click <span className="text-accent-cyan">Code ↗</span> to
        read the source.
      </motion.p>

      <div className="mt-16 flex flex-col gap-6 max-w-4xl">
        {HOW_IT_WORKS.map((step) => (
          <Step key={step.step} {...step} />
        ))}
      </div>
    </SectionWrapper>
  );
};
