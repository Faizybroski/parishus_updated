import React from "react";
import { ShieldCheck, Users, UtensilsCrossed, Heart, AlertTriangle, Camera } from "lucide-react";

export default function SafetyGuidelines() {
  return (
    <section className="min-h-screen bg-gradient-to-b from-[#0d0d0d] to-[#1a1a1a] text-gray-100 py-16 px-6 lg:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-[#e4c29a] mb-4">
            Parish Safety & Community Guidelines
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Every dinner is more than just a meal — it’s an opportunity to share stories, ideas, and laughter.
            To make sure each experience is safe, welcoming, and memorable, please keep these principles in mind.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-16">
          {/* Getting Ready */}
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-[#e4c29a] mb-6">
              <UtensilsCrossed className="h-7 w-7 text-[#e4c29a]" /> Getting Ready for Your Dinner
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li>✅ <span className="font-medium">Plan Ahead:</span> Review event details, address, and menu before arriving.</li>
              <li>✅ <span className="font-medium">Bring the Right Mindset:</span> Arrive with openness, curiosity, and respect.</li>
              <li>✅ <span className="font-medium">Let Someone Know:</span> Share your dinner plans with a trusted friend or family member.</li>
            </ul>
          </div>

          {/* During the Experience */}
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-[#e4c29a] mb-6">
              <Users className="h-7 w-7 text-[#e4c29a]" /> During the Experience
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li>🍽 <span className="font-medium">Respect the Table:</span> Keep conversations inclusive and considerate.</li>
              <li>🍽 <span className="font-medium">Mindful Choices:</span> Communicate dietary restrictions to staff.</li>
              <li>🍽 <span className="font-medium">Bill & Tipping:</span> Bring cash or card; tip 15–20% where customary.</li>
              <li>🍽 <span className="font-medium">Stay Present:</span> Keep phones on silent and limit distractions.</li>
            </ul>
          </div>

          {/* Respect & Conduct */}
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-[#e4c29a] mb-6">
              <Heart className="h-7 w-7 text-[#e4c29a]" /> Respect & Conduct
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li>🤝 <span className="font-medium">Kindness First:</span> Treat every guest with courtesy.</li>
              <li>🤝 <span className="font-medium">Diversity Matters:</span> Embrace different opinions and cultures.</li>
              <li>🤝 <span className="font-medium">Boundaries:</span> Share only what you’re comfortable with.</li>
            </ul>
          </div>

          {/* Safety Reminders */}
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-[#e4c29a] mb-6">
              <ShieldCheck className="h-7 w-7 text-[#e4c29a]" /> Safety Reminders
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li>🚦 <span className="font-medium">Look After Yourself:</span> Watch your drink and belongings.</li>
              <li>🚦 <span className="font-medium">Transport Wisely:</span> Don’t drive if unfit — use a ride share or taxi.</li>
              <li>🚦 <span className="font-medium">Report Concerns:</span> Contact parish support if issues arise.</li>
            </ul>
          </div>

          {/* Photos & Memories */}
          <div>
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-[#e4c29a] mb-6">
              <Camera className="h-7 w-7 text-[#e4c29a]" /> Photos & Memories
            </h2>
            <p className="text-gray-300">
              Photos or videos may be captured to highlight the community experience. By attending, you consent to their use in parish
              communications. If you prefer not to be included, please let our team know at the event.
            </p>
          </div>

          {/* Emergency */}
          <div className="bg-[#1f1f1f] border border-red-500/40 rounded-2xl p-6 shadow-xl">
            <h2 className="flex items-center gap-3 text-2xl font-semibold text-red-400 mb-4">
              <AlertTriangle className="h-7 w-7 text-red-400" /> In Case of Emergency
            </h2>
            <p className="text-gray-200">
              Always prioritize your safety. Call your local emergency services immediately if you need urgent help.
            </p>
          </div>
        </div>

        {/* Closing Note */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-400">
            ✨ By following these guidelines, you help create the warm, respectful, and enjoyable dining culture that makes <span className="text-[#e4c29a] font-medium">parish</span> unique.  
            Thank you for being part of our community.
          </p>
        </div>
      </div>
    </section>
  );
}
