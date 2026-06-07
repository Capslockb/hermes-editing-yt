import { Tilt } from "react-tilt";
import { motion } from "framer-motion";

import { github, preview } from "../assets";
import { PROJECTS } from "../constants";
import { SectionWrapper } from "../hoc";
import { styles } from "../styles";
import { cn } from "../utils/lib";
import { fadeIn, textVariant } from "../utils/motion";

type ProjectCardProps = (typeof PROJECTS)[number] & {
  index: number;
};

// Feature card. Glows with a violet halo on hover, and the title +
// description fade in/out as the card enters/leaves the center of
// the viewport. The `viewport` prop on whileInView makes the
// animation trigger when 30% of the card is visible.
const ProjectCard = ({
  index,
  name,
  description,
  tags,
  image,
  source_code_link,
  live_site_link,
}: ProjectCardProps) => (
  <motion.div
    variants={fadeIn("up", "spring", index * 0.5, 0.75)}
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: false, amount: 0.3 }}
    transition={{ duration: 0.6, delay: index * 0.1 }}
  >
    <Tilt
      options={{
        max: 45,
        scale: 1,
        speed: 450,
      }}
      className="bg-tertiary p-5 rounded-2xl sm:w-[360px] w-full relative
                 shadow-[0_0_30px_-15px_rgba(145,94,255,0.4)]
                 hover:shadow-[0_0_50px_-10px_rgba(145,94,255,0.6),0_0_80px_-20px_rgba(0,224,255,0.4)]
                 transition-shadow duration-500"
    >
      <div className="relative w-full h-[230px]">
        {/* Work image */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover rounded-2xl"
        />

        {/* Hover overlay: live site + github */}
        <div className="absolute inset-0 flex justify-end m-3 card-img_hover">
          <div
            onClick={() => window.open(live_site_link, "_blank", "noreferrer")}
            className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer"
          >
            <img
              src={preview}
              alt="Live Site"
              title="Live Site"
              className="w-2/3 h-2/3 object-contain"
            />
          </div>
          <div
            onClick={() =>
              window.open(source_code_link, "_blank", "noreferrer")
            }
            className="black-gradient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer ml-2"
          >
            <img
              src={github}
              alt="Github"
              title="Github"
              className="w-1/2 h-1/2 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Work info — fades in/out as the card crosses the viewport
          center. motion.div with viewport={{ once: false }} re-fires
          on every entry/exit transition. */}
      <motion.div
        className="mt-5"
        initial={{ opacity: 0.6, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 0.5 }}
      >
        <h3 className="text-white font-bold text-[24px]">{name}</h3>
        <p className="mt-2 text-secondary text-[14px]">{description}</p>
      </motion.div>

      {/* Tags — also fade in */}
      <motion.div
        className="mt-4 flex flex-wrap gap-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: false, amount: 0.4 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {tags.map((tag, tagIdx) => (
          <p
            key={`Tag-${tagIdx}`}
            className={cn(tag.color, "text-[14px]")}
          >
            #{tag.name}
          </p>
        ))}
      </motion.div>
    </Tilt>
  </motion.div>
);

// Works
export const Works = () => {
  return (
    <SectionWrapper idName="features">
      <>
        {/* Title — fades in when in viewport, lifts slightly on hover. */}
        <motion.div
          variants={textVariant()}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.4 }}
          transition={{ duration: 0.6 }}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="cursor-default"
        >
          <p className={styles.sectionSubText}>Key Capabilities</p>
          <h2 className={styles.sectionHeadText}>Features.</h2>
        </motion.div>

        <div className="w-full flex">
          <motion.p
            variants={fadeIn("", "", 0.1, 1)}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false, amount: 0.4 }}
            transition={{ duration: 0.6 }}
            className="mt-3 text-secondary text-[17px] max-w-3xl leading-[30px] text-center sm:text-left"
          >
            hermes-editing-yt brings professional-grade subtitle-driven video
            editing to your local machine. Each feature is designed to work
            together, powered by GPU-accelerated transcription and a flexible
            MCP tool interface. Click the GitHub icon to view the source code.
          </motion.p>
        </div>

        <div className="mt-20 flex flex-wrap gap-7 justify-center sm:justify-start">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={`project-${i}`} index={i} {...project} />
          ))}
        </div>
      </>
    </SectionWrapper>
  );
};
