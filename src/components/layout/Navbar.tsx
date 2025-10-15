import { Button } from "@/components/ui/button";
import { useNavigate, Link, useLocation } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();

  const handleScrollToSection = (sectionId) => {
    if (window.location.pathname !== "/") {
      navigate("/", { state: { scrollTo: sectionId } });
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-dark-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          className="cursor-pointer flex items-center space-x-1 shrink-0"
          to={"/"}
        >
          <img
            className="w-10 h-8 mr-2 object-contain"
            src="/Parishus logo.png"
            alt="Logo"
          />
          <h1
            className="text-2xl font-bold bg-gradient-primary bg-clip-text text-black whitespace-nowrap font-script"
            style={{ fontSize: "30px" }}
          >
            Parish
          </h1>
        </Link>

        {/* Menu */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button onClick={() => handleScrollToSection("how")}>
            How it works
          </button>
          <button onClick={() => handleScrollToSection("events")}>
            Events
          </button>
          <button onClick={() => handleScrollToSection("faq")}>FAQ</button>
          <Link to={"/contact-us"}>
            <button>Contact Us</button>
          </Link>
        </nav>

        {/* Button */}
        <div className="flex items-center gap-4">
          <Link to={"/login"}>
          <Button
            variant="outline"
            size="default"
          >
            Sign In
          </Button>
          </Link>
          <Link to={"/auth"}>
          <Button
            variant="default"
            size="default"
          >
            Sign Up
          </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};
