import { SOCIALS } from "../constants";
import { styles } from "../styles";
import { cn } from "../utils/lib";

// Footer
const Footer = () => {
  return (
    <nav
      className={cn(
        styles.paddingX,
        "w-full flex items-center py-8 bg-primary border-t border-t-secondary/5"
      )}
    >
      <div className="w-full flex flex-col sm:flex-row justify-between items-center max-w-7xl mx-auto gap-4 sm:gap-0">
        <p className="text-white text-md font-bold text-center sm:text-left">
          &copy; hermes-editing-yt {new Date().getFullYear()}. MIT License.
        </p>

        {/* Nav Links (Desktop) */}
        <ul className="list-none hidden flex-row sm:flex gap-4 items-center">
          <li className="text-secondary text-[12px]">
            Built on{" "}
            <a
              href="https://github.com/sanidhyy/3d-portfolio"
              target="_blank"
              rel="noreferrer noopener"
              className="underline hover:text-white transition"
            >
              sanidhyy/3d-portfolio (MIT)
            </a>
          </li>
          {SOCIALS.map((social) => (
            <li
              key={social.name}
              className="text-secondary font-poppins font-medium cursor-pointer text-[16px] opacity-80 hover:opacity-100 transition"
            >
              <a href={social.link} target="_blank" rel="noreferrer noopener">
                <img src={social.icon} alt={social.name} className="h-6 w-6" />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Footer;
