import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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
        <div
          className="cursor-pointer flex items-center space-x-1 shrink-0"
          onClick={() => navigate("/")}
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
        </div>

        {/* Menu */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <button onClick={() => handleScrollToSection("how")}>How it works</button>
          <button onClick={() => handleScrollToSection("events")}>Events</button>
          <button onClick={() => handleScrollToSection("faq")}>FAQ</button>
          <button onClick={() => navigate("/contact-us")}>Contact Us</button>
        </nav>

        {/* Button */}
        <div className="flex items-center gap-4">
        <Button variant="outline" size="default" onClick={() => navigate("/login")}>
          Sign In
        </Button>
        <Button variant="default" size="default" onClick={() => navigate("/auth")}>
          Sign Up
        </Button>
        </div>
      </div>
    </header>
  );
};
