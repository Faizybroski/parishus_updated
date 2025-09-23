import { useEffect } from "react";
import { Clock, Mail, Shield } from "lucide-react"; // Icons for waiting/verification

const PendingApproval = () => {

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#121212] via-[#1E1E1E] to-[#121212] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Floating shield for security */}
      <div className="absolute top-10 left-10 animate-bounce">
        <Shield size={50} className="text-[#9DC0B3] opacity-40" />
      </div>

      {/* Floating clock for waiting */}
      <div className="absolute bottom-10 right-10 animate-spin-slow">
        <Clock size={60} className="text-[#F7C992] opacity-30" />
      </div>

      <div className="text-center max-w-xl z-10">
        <h1 className="text-[4rem] font-extrabold mb-2 text-[#F7C992] leading-none animate-pulse">
          Approval Pending
        </h1>
        <p className="text-2xl font-medium mb-4 text-[#FEFEFE] animate-fadeIn">
          Thanks for signing up!
        </p>
        <p className="text-lg text-[#9DC0B3] mb-8">
          Our team is reviewing your account details.  
          You’ll get an email once you’ve been approved.
        </p>
      </div>

      {/* Decorative animated dots */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-[#F7C992] rounded-full animate-ping"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-[#9DC0B3] rounded-full animate-ping"></div>
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-[#FEFEFE] rounded-full animate-ping"></div>
    </div>
  );
};

export default PendingApproval;
