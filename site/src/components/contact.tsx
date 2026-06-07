import { motion } from "framer-motion";

import { EarthCanvas } from "./canvas";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { slideIn } from "../utils/motion";

// Install code snippets
const INSTALL_COMMANDS = [
  {
    label: "Windows (PowerShell)",
    code: `iwr -useb https://raw.githubusercontent.com/Capslockb/hermes-editing-yt/main/installer/install.ps1 | iex`,
    lang: "powershell",
  },
  {
    label: "Linux / macOS",
    code: `curl -sSL https://raw.githubusercontent.com/Capslockb/hermes-editing-yt/main/installer/install.sh | bash`,
    lang: "bash",
  },
  {
    label: "TUI (Manual)",
    code: `git clone https://github.com/Capslockb/hermes-editing-yt.git
cd hermes-editing-yt
python installer/install.py`,
    lang: "bash",
  },
];

// Copy button component
const CopyButton = ({ text }: { text: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy to clipboard"
      className="absolute top-3 right-3 bg-tertiary hover:bg-black-100 text-white text-xs px-3 py-1 rounded-lg transition"
    >
      Copy
    </button>
  );
};

// Install
export const Contact = () => {
  return (
    <SectionWrapper idName="install">
      <div className="xl:mt-12 xl:flex-row flex-col-reverse flex gap-10 overflow-hidden">
        <motion.div
          variants={slideIn("left", "tween", 0.2, 1)}
          className="flex-[0.75] bg-black-100 p-8 rounded-2xl"
        >
          {/* Title */}
          <p className={styles.sectionSubText}>Get started</p>
          <h3 className={styles.sectionHeadText}>Install.</h3>

          {/* Description */}
          <p className="mt-4 text-secondary text-[17px] max-w-3xl leading-[30px]">
            Install hermes-editing-yt with a single command — no npm, no manual
            setup. Choose your platform below.
          </p>

          {/* Install Code Snippets */}
          <div className="mt-8 flex flex-col gap-6">
            {INSTALL_COMMANDS.map((cmd) => (
              <div key={cmd.label}>
                <p className="text-white font-medium mb-2 text-sm">
                  {cmd.label}
                </p>
                <div className="relative bg-tertiary rounded-lg p-4 overflow-x-auto">
                  <pre className="text-accent-cyan text-sm font-mono whitespace-pre-wrap">
                    {cmd.code}
                  </pre>
                  <CopyButton text={cmd.code} />
                </div>
              </div>
            ))}
          </div>

          {/* GitHub CTA */}
          <div className="mt-8">
            <a
              href="https://github.com/Capslockb/hermes-editing-yt"
              target="_blank"
              rel="noreferrer noopener"
              className="bg-[#915eff] hover:bg-[#7a3dff] py-4 px-10 outline-none w-fit text-white font-bold text-lg shadow-md shadow-primary rounded-xl inline-block transition"
            >
              View on GitHub →
            </a>
          </div>

          {/* Attribution */}
          <p className="mt-6 text-secondary text-[12px]">
            Built on{" "}
            <a
              href="https://github.com/sanidhyy/3d-portfolio"
              target="_blank"
              rel="noreferrer noopener"
              className="text-[#915eff] underline"
            >
              sanidhyy/3d-portfolio (MIT)
            </a>
          </p>
        </motion.div>

        {/* Earth Model */}
        <motion.div
          variants={slideIn("right", "tween", 0.2, 1)}
          className="xl:flex-1 xl:h-auto md:h-[550px] h-[350px]"
        >
          <EarthCanvas />
        </motion.div>
      </div>
    </SectionWrapper>
  );
};
