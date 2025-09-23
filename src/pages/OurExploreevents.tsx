import React, { useState } from "react";

const OurExploreevents = () => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const [trending, setTrending] = useState("Trending");
  const [timeframe, setTimeframe] = useState("This Week");
  const [city, setCity] = useState("Los Angeles");

  const trendingOptions = ["Trending", "Newest", "Largest"];
  const timeframeOptions = ["Today", "This Month", "Right Now"];
  const cityOptions = [
    "Near Me",
    "New York City",
    "Miami",
    "Washington DC",
    "Boston",
    "Atlanta",
  ];

  return (
    <nav className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-slate-900 via-red-900 to-yellow-900 text-white">
      <div className="font-extrabold italic text-xl">posh</div>
      <div className="flex items-center gap-5 bg-white/20 rounded-full px-4 py-2 backdrop-blur-md">
        {[
          { label: trending, options: trendingOptions, setter: setTrending },
          { label: timeframe, options: timeframeOptions, setter: setTimeframe },
          { label: city, options: cityOptions, setter: setCity, city: true },
        ].map((menu, idx) => (
          <div key={idx} className="relative">
            <button
              className="px-3 py-1 flex items-center gap-1 text-sm font-semibold hover:text-gray-200"
              onClick={() =>
                setOpenDropdown(openDropdown === idx ? null : idx)
              }
            >
              {idx === 2 && <span className="opacity-70">in</span>}
              {menu.label} <span className="text-xs">▼</span>
            </button>
            {openDropdown === idx && (
              <div className="absolute left-0 mt-2 bg-white text-black rounded-lg shadow-md z-20 min-w-[160px]">
                {menu.options.map((opt) => (
                  <div
                    key={opt}
                    onClick={() => {
                      menu.setter(opt);
                      setOpenDropdown(null);
                    }}
                    className="px-4 py-2 hover:bg-gray-200 cursor-pointer"
                  >
                    {opt}
                  </div>
                ))}
                {menu.city && (
                  <input
                    type="text"
                    placeholder="Enter a City"
                    className="w-full px-4 py-2 border-t border-gray-300 outline-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target.value) {
                        menu.setter(e.target.value);
                        e.target.value = "";
                        setOpenDropdown(null);
                      }
                    }}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm hover:underline">Log In</button>
        <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-200 transition">
          Create An Event
        </button>
      </div>
    </nav>
  );
};

export default OurExploreevents;
