import React, { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { ChevronDown, Calendar, Turtle } from "lucide-react";
import PriceFilter from "@/components/filter/PriceFilter";
import ParishLogo from "@/components/ui/logo";
import { LoaderText } from "@/components/loader/Loader";
import { useZoomWidth } from "@/hooks/use-width";

const OurExploreEvents = () => {
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [trending, setTrending] = useState("Trending");
  const [timeframe, setTimeframe] = useState("This Week");
  const [city, setCity] = useState("Los Angeles");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFeatured, setShowFeatured] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 200]); // min and max
  const maxPrice = 1000; // or whatever ceiling you want
  const width = useZoomWidth();

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
  const sliderData = [
    {
      image:
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
      title: "Wheels of NYC - Fall Edition",
      location: "63 Flushing Ave, Brooklyn, NY",
      dateTime: "Saturday September 27, 11:00 AM",
    },
    {
      image:
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-alts-production.s3.amazonaws.com/68bf6213ee6cfb687a56c36a/1400x1750.webp",
      title: "Dionysus: Casino Royale Night",
      location: "Luxury Hall, NYC",
      dateTime: "Saturday September 27, 10:00 PM",
    },
    {
      image:
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
      title: "Wheels of NYC - Fall Edition",
      location: "63 Flushing Ave, Brooklyn, NY",
      dateTime: "Saturday September 27, 11:00 AM",
    },
    {
      image:
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-alts-production.s3.amazonaws.com/68bf6213ee6cfb687a56c36a/1400x1750.webp",
      title: "Dionysus: Casino Royale Night",
      location: "Luxury Hall, NYC",
      dateTime: "Saturday September 27, 10:00 PM",
    },
    {
      image:
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
      title: "Wheels of NYC - Fall Edition",
      location: "63 Flushing Ave, Brooklyn, NY",
      dateTime: "Saturday September 27, 11:00 AM",
    },
    {
      image:
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-alts-production.s3.amazonaws.com/68bf6213ee6cfb687a56c36a/1400x1750.webp",
      title: "Dionysus: Casino Royale Night",
      location: "Luxury Hall, NYC",
      dateTime: "Saturday September 27, 10:00 PM",
    },
    {
      image:
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
      title: "Wheels of NYC - Fall Edition",
      location: "63 Flushing Ave, Brooklyn, NY",
      dateTime: "Saturday September 27, 11:00 AM",
    },
    {
      image:
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-alts-production.s3.amazonaws.com/68bf6213ee6cfb687a56c36a/1400x1750.webp",
      title: "Dionysus: Casino Royale Night",
      location: "Luxury Hall, NYC",
      dateTime: "Saturday September 27, 10:00 PM",
    },
  ];

  const events = [
    {
      image:
        "https://posh.vip/cdn-cgi/image/width=1080,quality=75,fit=scale-down,format=auto/https://posh-images-originals-production.s3.amazonaws.com/68cd95ca14a830801c692394",
      date: "WED . OCT 01 . 6:00 PM",
      name: "Industry Link XV: Game Time",
      city: "Slate",
    },
    {
      image:
        "https://posh.vip/cdn-cgi/image/width=1080,quality=75,fit=scale-down,format=auto/https://posh-images-originals-production.s3.amazonaws.com/68d16a2a37fbb1803ecf52ee",
      date: "FRI . 10:00 PM",
      name: "A Caribbean Party In Brooklyn",
      city: "Lot45",
    },
    {
      image:
        "https://posh.vip/cdn-cgi/image/width=1080,quality=75,fit=scale-down,format=auto/https://posh-images-originals-production.s3.amazonaws.com/68c873c86195ca0793114c4b",
      date: "THU . 10:00 PM",
      name: "Montclair State University Homecoming Weekend 2025",
      city: "Locations In Description 📍",
    },
  ];

  const repeatedEvents = Array.from(
    { length: 42 },
    (_, i) => events[i % events.length]
  );

  const cardImages = [
    "https://posh.vip/cdn-cgi/image/width=1080,quality=75,fit=scale-down,format=auto/https://posh-images-originals-production.s3.amazonaws.com/68d16a2a37fbb1803ecf52ee",
    "https://posh.vip/cdn-cgi/image/width=1080,quality=75,fit=scale-down,format=auto/https://posh-images-originals-production.s3.amazonaws.com/68c873c86195ca0793114c4b",
    "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68a3b441145a5d2c323b60f0",
  ];

  const NavControls = ({
    trending,
    setTrending,
    timeframe,
    setTimeframe,
    city,
    setCity,
    trendingOptions,
    timeframeOptions,
    cityOptions,
    openDropdown,
    setOpenDropdown,
  }) => {
    return (
      <div className="flex items-center gap-5 bg-white/20 rounded-full px-4 py-2 backdrop-blur-md">
        {[
          { label: trending, options: trendingOptions, setter: setTrending },
          { label: timeframe, options: timeframeOptions, setter: setTimeframe },
          { label: city, options: cityOptions, setter: setCity, city: true },
        ].map((menu, idx) => (
          <div key={idx} className="relative">
            <button
              className="px-3 py-1 flex items-center gap-1 text-sm font-semibold text-white hover:text-gray-200"
              onClick={() => setOpenDropdown(openDropdown === idx ? null : idx)}
            >
              {idx === 2 && <span className="opacity-70">in</span>}
              {menu.label}
              <ChevronDown className="w-4 h-4" />
            </button>

            {openDropdown === idx && (
              <div className="absolute left-0 mt-2 bg-white text-black rounded-lg shadow-md z-40 min-w-[160px]">
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
                      const target = e.target as HTMLInputElement;
                      if (e.key === "Enter" && target.value) {
                        menu.setter(target.value);
                        target.value = "";
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
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoaderText text="Parish" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white">
      <div className="w-full relative -mt-[2px]">
        {/* Nav ABOVE carousel */}
        <nav className="absolute top-0 left-0 w-full z-30 h-[80px] hidden sm:block">
          {/* Matte background synced with current slide */}
          <div
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: `url(${sliderData[currentSlide].image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.5) blur(8px)",
            }}
          ></div>

          {/* Overlay content (nav controls) */}
          <div className="relative z-10 backdrop-blur-md bg-black/40">
            <div className="flex items-center justify-center px-6 py-5">
              <NavControls
                trending={trending}
                setTrending={setTrending}
                timeframe={timeframe}
                setTimeframe={setTimeframe}
                city={city}
                setCity={setCity}
                trendingOptions={trendingOptions}
                timeframeOptions={timeframeOptions}
                cityOptions={cityOptions}
                openDropdown={openDropdown}
                setOpenDropdown={setOpenDropdown}
              />
            </div>
          </div>
        </nav>

        {/* Carousel BELOW nav */}
        <div className="sm:pt-[80px] touch-pan-y" style={{ touchAction: "pan-y" }}>
          <Carousel
            showThumbs
            autoPlay
            infiniteLoop
            showStatus={false}
            interval={4000}
            showArrows
            onChange={(index) => setCurrentSlide(index)}
            swipeable={false}
            emulateTouch={false}
            className="rounded-b-xl overflow-hidden"
          >
            {sliderData.map((item, index) => (
              <div
                key={index}
                className="relative rounded-xl flex flex-col font-sans lg:flex-row items-center justify-center px-4 sm:px-8 lg:px-12 py-6 sm:py-10 gap-6 lg:gap-10 min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh]"
                style={{ touchAction: "pan-y" }}
              >
                {/* Matte background */}
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    // filter: "brightness(0.4) blur(10px)",
                    filter: "brightness(0.35) blur(8px)",
                  }}
                ></div>
                <div className="absolute inset-0 rounded-xl z-0 bg-gradient-to-b from-neutral-100/20 via-neutral-200/5 to-transparent backdrop-blur-lg"></div>

                {/* Content wrapper */}
                <div className="relative z-10 flex flex-col lg:flex-row items-center justify-center w-full p-7 gap-8">
                  {/* Image container */}
                  <div className="w-full sm:w-[70%] md:w-[60%] lg:w-[30%] max-w-[500px]">
                    <img
                      src={item.image}
                      alt={`Event ${index + 1}`}
                      className="w-full h-auto rounded-xl shadow-2xl object-cover"
                    />
                  </div>

                  {/* Text content */}
                  <div className="text-white flex flex-col justify-center items-center lg:items-start text-center lg:text-left max-w-2xl px-2 sm:px-0">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 leading-tight">
                      {item.title}
                    </h2>
                    <p className="text-base sm:text-lg md:text-xl mb-2 text-gray-200">
                      {item.location}
                    </p>
                    <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-6">
                      {item.dateTime}
                    </p>
                    <button className="bg-white text-black px-6 sm:px-8 py-2 sm:py-3 rounded-full font-semibold hover:bg-gray-200 transition-all duration-200">
                      Get Tickets
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </Carousel>
        </div>
      </div>

      <div className=" w-full z-50 bg-black/80 backdrop-blur-md flex sm:hidden">
        <button
          className={`flex-1 py-3 text-center font-semibold ${
            showFeatured ? "bg-white text-black" : "text-white"
          }`}
          onClick={() => setShowFeatured(!showFeatured)}
        >
          Featured Events
        </button>
        <button
          className="flex-1 py-3 text-center font-semibold text-white"
          onClick={() => setFilterOpen(true)}
        >
          Filter
        </button>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-[#111] rounded-lg p-6 w-[90%] max-w-md">
            {/* ✅ Mobile-friendly filter controls */}
            <div className="flex flex-col gap-4 text-white text-sm">
              {/* Trending */}
              <div>
                <label className="block mb-1 text-gray-400">Trending</label>
                <select
                  value={trending}
                  onChange={(e) => setTrending(e.target.value)}
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {trendingOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block mb-1 text-gray-400">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                >
                  {timeframeOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block mb-1 text-gray-400">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter a City"
                  className="w-full bg-black/50 border border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-white"
                />
              </div>
            </div>
            <div className="mt-6">
              <PriceFilter
                onApply={(selectedRange) => {
                  setPriceRange(selectedRange);
                  setFilterOpen(false);
                }}
                onClose={() => setFilterOpen(false)} // 👈 pass this too
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-center gap-5 px-4 my-5">
        {repeatedEvents.map((event, index) => (
          <div
            key={index}
            className="font-sans rounded-lg overflow-hidden shadow-md border border-gray-200 hover:border-gray-700 hover:bg-white/10 hover:cursor-pointer transition-all duration-300 w-full sm:w-[90%] md:w-[45%] lg:w-[30%] max-w-[420px]"
          >
            <div className="relative">
              {/* Image */}
              <img
                className="w-full object-cover"
                style={{ height: "35rem" }}
                src={event.image}
                alt={event.name}
              />

              {/* Title container with black bg + gradient top */}
              <div className="absolute inset-x-0 bottom-0">
                <div className="relative bg-black">
                  <div className="absolute -top-[17.5rem] left-0 right-0 h-[17.5rem] bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10"></div>
                  <span className="absolute -top-12 left-5 border border-white/20 text-white text-sm px-3 py-2 rounded shadow-md z-20">
                    {event.date}
                  </span>
                  <div className="absolute -top-32 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent"></div>

                  <div className="pl-5 pt-1 flex flex-col gap-2 relative z-10">
                    <h3 className="text-2xl text-white">{event.name}</h3>
                    <p className="text-white pb-7 text-sm">{event.city}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OurExploreEvents;
