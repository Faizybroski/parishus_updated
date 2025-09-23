import { Link } from "react-router-dom";
import ParishLogo from "@/components/ui/logo";

export const Footer = () => {
  return (
    <footer className="bg-dark-surface border-b border-border py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <ParishLogo />
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/80">
            <Link to="/contact-us" className="text-white">
              Contact Us
            </Link>
            <Link to="/refund-policy" className="text-white">
              Refund Policy
            </Link>
            <Link to="/safety-guidelines" className="text-white">
              Safety Guidelines
            </Link>
            <Link to="/terms-conditions" className="text-white">
              Terms & Conditions
            </Link>
            <Link to="/privacy-policy" className="text-white">
              Privacy Policy
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-white text-center">
            © {new Date().getFullYear()} Parish
          </p>
        </div>
      </div>
    </footer>
  );
};
