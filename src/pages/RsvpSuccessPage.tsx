import { Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function RsvpSuccessPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center px-4 py-5">
      <div className="max-w-sm w-full bg-[#1e1e1e] text-white p-6 rounded-3xl shadow-lg border border-[#3b3b3b] flex flex-col items-center space-y-6">
        <h1
          className="text-center mt-4"
          style={{
            fontWeight: "bold",
            fontSize: "47px",
            lineHeight: "53px",
            padding: "0 5px",
            fontFamily: "revert-layer",
            color: "#f3c88d",
          }}
        >
          You've RSVP'd!
        </h1>

        <img
          src="/rsvp.jpeg"
          alt="Celebration"
          className="w-full rounded-xl"
          height={"360px"}
        />

        <button
          onClick={() => navigate("/rsvps")}
          className="w-full flex items-center justify-center gap-2 bg-success border border-black text-black py-3 rounded-xl bg-secondary/90 hover:text-success transition-all duration-300 flex-grow px-4 py-4 text-lg font-medium bg-secondary text-black hover:bg-secondary/90 flex-grow px-4 py-4 text-lg font-medium bg-secondary text-black hover:bg-secondary/90"
        >
          <Calendar className="w-5 h-5" />
          View Reservation
        </button>
      </div>
    </div>
  );
}
