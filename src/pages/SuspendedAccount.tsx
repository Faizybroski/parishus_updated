import { useEffect } from "react";
import { PauseCircle, AlertTriangle, Lock } from "lucide-react"; // Icons for suspension

const SuspendedAccount = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a1a] via-[#222222] to-[#1a1a1a] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Floating alert icon for attention */}
      <div className="absolute top-12 left-12 animate-bounce">
        <AlertTriangle size={50} className="text-yellow-400 opacity-40" />
      </div>

      {/* Floating lock for account restriction */}
      <div className="absolute bottom-12 right-12 animate-spin-slow">
        <Lock size={60} className="text-yellow-500 opacity-30" />
      </div>

      <div className="text-center max-w-xl z-10">
        <h1 className="text-[4rem] font-extrabold mb-2 text-yellow-500 leading-none animate-pulse">
          Account Suspended
        </h1>
        <p className="text-2xl font-medium mb-4 text-[#fefefe] animate-fadeIn">
          Your account has been temporarily disabled due to policy violations or suspicious activity.
        </p>
        {/* <p className="text-lg text-[#d4d4d4] mb-8">
          Please contact our support team to resolve this issue and restore your access.
        </p>
        <a
          href="mailto:support@example.com"
          className="px-6 py-3 rounded-lg bg-yellow-500 text-black font-semibold hover:bg-yellow-400 transition"
        >
          Contact Support
        </a> */}
      </div>

      {/* Decorative animated dots */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-[#9DC0B3] rounded-full animate-ping"></div>
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#FEFEFE] rounded-full animate-ping"></div>
    </div>
  );
};

export default SuspendedAccount;
