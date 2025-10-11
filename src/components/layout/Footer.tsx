import { Link } from "react-router-dom";
import ParishLogo from "@/components/ui/logo";

export const Footer = () => {
  return (
    <footer className="bg-primary border-b border-border py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center">
            <ParishLogo />
          </div>

          {/* Links */}
          <nav className="flex flex-wrap justify-center gap-6 text-sm text-primary-foreground/80">
            <Link to="/contact-us">
              Contact Us
            </Link>
            <Link to="/refund-policy">
              Refund Policy
            </Link>
            <Link to="/safety-guidelines">
              Safety Guidelines
            </Link>
            <Link to="/terms-conditions">
              Terms & Conditions
            </Link>
            <Link to="/privacy-policy">
              Privacy Policy
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-center">
            © {new Date().getFullYear()} Parish
          </p>
        </div>
      </div>
    </footer>
  );
};
