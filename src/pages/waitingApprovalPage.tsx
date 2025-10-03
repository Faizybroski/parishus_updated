import { useEffect } from "react";
import { Clock, Mail, Shield } from "lucide-react"; // Icons for waiting/verification

const PendingApproval = () => {

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Floating shield for security */}
      <div className="absolute top-10 left-10 animate-bounce">
        <Shield size={50} className="text-primary opacity-40" />
      </div>

      {/* Floating clock for waiting */}
      <div className="absolute bottom-10 right-10 animate-bounce">
        <Clock size={60} className="text-secondary opacity-50" />
      </div>

      <div className="text-center max-w-xl z-10">
        <h1 className="text-[4rem] font-extrabold mb-2 leading-none animate-pulse font-script">
          Approval Pending
        </h1>
        <p className="text-2xl font-medium mb-4 text-mute-foreground animate-fadeIn">
          Thanks for signing up!
        </p>
        <p className="text-lg text-mute mb-8">
          Our team is reviewing your account details.  
          You’ll get an email once you’ve been approved.
        </p>
      </div>

      {/* Decorative animated dots */}
      <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-primary rounded-full animate-ping"></div>
      <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-secondary rounded-full animate-ping"></div>
      <div className="absolute bottom-1/4 left-1/4 w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
    </div>
  );
};

export default PendingApproval;
