import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const navigate = useNavigate();
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
            className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent whitespace-nowrap"
            style={{ fontSize: "30px", color: "#9dc0b3", fontFamily: "Sergio Trendy" }}
          >
            Parish
          </h1>
        </div>

        {/* Menu */}
        {/* <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <a href="#how" className="text-black transition-colors">How it works</a>
          <a href="#events" className="text-black transition-colors">Events</a>
          <a href="#faq" className="text-black transition-colors">FAQ</a>
          <span
            onClick={() => navigate("/contact-us")}
            className="text-black cursor-pointer transition-colors"
          >
            Contact Us
          </span>
        </nav> */}

        {/* Button */}
        <Button
          variant="default"
          size="default"
          className="bg-[#9dc0b3]"
          onClick={() => navigate("/auth")}
        >
          Sign Up
        </Button>
      </div>
    </header>
  );
};
