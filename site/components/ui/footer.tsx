import Image from "next/image";
import FooterIllustration from "@/public/images/footer-illustration.svg";

export default function Footer() {
  return (
    <footer>
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Footer illustration */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 -z-10 -translate-x-1/2"
          aria-hidden="true"
        >
          <Image
            className="max-w-none"
            src={FooterIllustration}
            width={1076}
            height={378}
            alt="Footer illustration"
          />
        </div>
        <div className="flex flex-col items-center py-8 text-center md:py-12">
          <div className="mb-4">
            <span className="font-nacelle text-lg font-semibold text-gray-200">
              hermes-editing-yt
            </span>
          </div>
          <div className="text-sm text-indigo-200/65">
            <p className="mb-1">
              MIT License &middot;{" "}
              <a
                className="text-indigo-200/65 transition hover:text-indigo-500"
                href="https://github.com/Capslockb/hermes-editing-yt"
              >
                GitHub
              </a>
            </p>
            <p className="text-indigo-200/65">
              Built with{" "}
              <a
                className="text-indigo-200/65 transition hover:text-indigo-500"
                href="https://cruip.com/open-pro/"
              >
                Cruip Open (MIT)
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
