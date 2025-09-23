import { useEffect } from "react";
import { XCircle, Mail, ShieldOff } from "lucide-react"; // Icons for rejection

const RejectedRegistration = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] via-[#1E1E1E] to-[#121212] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Floating shield-off for security rejection */}
      <div className="absolute top-10 left-10 animate-bounce">
        <ShieldOff size={50} className="text-red-400 opacity-40" />
      </div>

      {/* Floating X-circle for rejection */}
      <div className="absolute bottom-10 right-10 animate-spin-slow">
        <XCircle size={60} className="text-red-500 opacity-30" />
      </div>

      <div className="text-center max-w-xl z-10">
        <h1 className="text-[4rem] font-extrabold mb-2 text-red-500 leading-none animate-pulse">
          Profile Rejected
        </h1>
        <p className="text-2xl font-medium mb-4 text-[#FEFEFE] animate-fadeIn">
          We’re sorry, but your account could not be approved.
        </p>
        {/* <p className="text-lg text-[#9DC0B3] mb-8">
          If you believe this is a mistake, please contact our support team at{" "}
          <a
            href="mailto:support@example.com"
            className="underline text-[#F7C992] hover:text-[#FFD580] transition"
          >
            support@example.com
          </a>{" "}
          for further assistance.
        </p> */}
      </div>

      {/* Decorative animated dots */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-[#9DC0B3] rounded-full animate-ping"></div>
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#FEFEFE] rounded-full animate-ping"></div>
    </div>
  );
};

export default RejectedRegistration;
