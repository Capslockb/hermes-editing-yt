"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Illustration from "@/public/images/page-illustration.svg";
import BlurredShapeGray from "@/public/images/blurred-shape-gray.svg";
import BlurredShape from "@/public/images/blurred-shape.svg";

export default function PageIllustration({
  multiple = false,
}: {
  multiple?: boolean;
}) {
  return (
    <>
      <motion.div
        className="pointer-events-none absolute left-1/2 top-0 -z-10 -translate-x-1/4"
        aria-hidden="true"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          className="max-w-none"
          src={Illustration}
          width={846}
          height={594}
          alt="Page illustration"
        />
      </motion.div>
      {multiple && (
        <>
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[400px] -z-10 -mt-20 -translate-x-full opacity-50"
            aria-hidden="true"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5,
            }}
          >
            <Image
              className="max-w-none"
              src={BlurredShapeGray}
              width={760}
              height={668}
              alt="Blurred shape"
            />
          </motion.div>
          <motion.div
            className="pointer-events-none absolute left-1/2 top-[440px] -z-10 -translate-x-1/3"
            aria-hidden="true"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          >
            <Image
              className="max-w-none"
              src={BlurredShape}
              width={760}
              height={668}
              alt="Blurred shape"
            />
          </motion.div>
        </>
      )}
    </>
  );
}
