// Pre defined Styles
export const styles = {
  paddingX: "sm:px-16 px-6",
  paddingY: "sm:py-16 py-6",
  padding: "sm:px-16 px-6 sm:py-16 py-10",

  // Hero: on mobile the whole block is centered, on desktop it sits
  // top-left of the section as the original design intended.
  heroHeadText:
    "font-black text-white lg:text-[80px] sm:text-[60px] xs:text-[50px] text-[36px] xs:leading-[1.05] leading-[1.1] mt-2 text-center sm:text-left",
  heroSubText:
    "text-[#dfd9ff] font-medium lg:text-[30px] sm:text-[26px] xs:text-[20px] text-[15px] lg:leading-[40px] text-center sm:text-left",

  // Section headers: centered on mobile, left on desktop. Body
  // paragraphs use the same trick.
  sectionHeadText:
    "text-white font-black md:text-[60px] sm:text-[50px] xs:text-[40px] text-[30px] text-center sm:text-left",
  sectionSubText:
    "sm:text-[18px] text-[14px] text-secondary uppercase tracking-wider text-center sm:text-left",
} as const;
