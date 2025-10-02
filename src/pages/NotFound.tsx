import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home, Compass, Ghost } from "lucide-react"; // Lucide icons for fun elements

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Floating ghost */}
      <div className="absolute top-10 left-10 animate-bounce">
        <Ghost size={50} className="text-primary opacity-40" />
      </div>

      {/* Floating compass */}
      <div className="absolute bottom-10 right-10 animate-spin-slow">
        <Compass size={60} className="text-secondary opacity-30" />
      </div>

      <div className="text-center max-w-xl z-10">
        <h1 className="text-[8rem] font-extrabold mb-2 leading-none animate-pulse font-script">
          404
        </h1>
        <p className="text-2xl font-medium mb-4  animate-fadeIn">
          Uh-oh! You’re lost in the void.
        </p>
        <p className="text-lg  mb-8">
          Looks like this page hasn’t been built yet.  
          Maybe our ghost friend can guide you home!
        </p>

        <a
          href="/"
          className="inline-flex items-center gap-2 bg-primary hover:bg-secondary/80 text-black font-semibold px-6 py-3 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <Home size={20} /> Take Me Home
        </a>
      </div>

      {/* Floating decorative stars */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-[#F7C992] rounded-full animate-ping"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-[#9DC0B3] rounded-full animate-ping"></div>
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#FEFEFE] rounded-full animate-ping"></div>
    </div>
  );
};

export default NotFound;
