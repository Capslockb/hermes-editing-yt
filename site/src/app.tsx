import { Component, useState, type ReactNode, type ErrorInfo } from "react";
import { BrowserRouter } from "react-router-dom";
import {
  About,
  Contact,
  Experience,
  Hero,
  HowItWorks,
  Navbar,
  Pipelines,
  Resources,
  SidebarTOC,
  Tech,
  Works,
  StarsCanvas,
} from "./components";
import Banner from "./components/banner";
import Footer from "./components/footer";

// Page-level error boundary. Without this, a runtime error in any child
// unmounts the entire tree and the user sees a blank page (the "loads
// temporarily then grey blank" symptom). Catching the error here means
// the rest of the page stays interactive.
class PageErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("hermes-editing-yt page error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-primary text-white p-8">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4 text-[#915eff]">
              Something went wrong rendering the site.
            </h1>
            <p className="text-secondary mb-4">
              The repo, installer, and CLI are unaffected. You can still
              install hermes-editing-yt from the command line.
            </p>
            <pre className="text-xs text-left bg-black-100 p-4 rounded overflow-auto max-h-48">
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <a
              href="https://github.com/Capslockb/hermes-editing-yt"
              className="inline-block mt-4 bg-[#915eff] hover:bg-[#7a3dff] py-3 px-6 rounded-xl font-bold"
            >
              View on GitHub →
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// App
const App = () => {
  const [hide, setHide] = useState(true);

  return (
    <BrowserRouter>
      <PageErrorBoundary>
        <div className="bg-grain" aria-hidden="true" />
        <div className="bg-vignette" aria-hidden="true" />
        <Banner hide={hide} setHide={setHide} />
        <SidebarTOC />
        <div className="relative z-0 bg-primary">
          <div className="bg-hero-pattern bg-cover bg-no-repeat bg-center">
            <Navbar hide={hide} />
            <Hero />
          </div>
          <HowItWorks />
          <About />
          <Experience />
          <Tech />
          <Works />
          <Pipelines />
          <Resources />

          {/* Contact */}
          <div className="relative z-0">
            <Contact />
            <StarsCanvas />
          </div>
          <Footer />
        </div>
      </PageErrorBoundary>
    </BrowserRouter>
  );
};

export default App;
