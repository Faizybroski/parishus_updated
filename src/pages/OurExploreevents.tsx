import React, { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { ChevronDown, Calendar } from "lucide-react";
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
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
      title: "High Status Saturday's CBC Edition",
      location: "Club XYZ, Manhattan, NY",
      dateTime: "Saturday September 27, 8:00 PM",
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
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
      title: "High Status Saturday's CBC Edition",
      location: "Club XYZ, Manhattan, NY",
      dateTime: "Saturday September 27, 8:00 PM",
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
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
      title: "High Status Saturday's CBC Edition",
      location: "Club XYZ, Manhattan, NY",
      dateTime: "Saturday September 27, 8:00 PM",
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
        "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
      title: "High Status Saturday's CBC Edition",
      location: "Club XYZ, Manhattan, NY",
      dateTime: "Saturday September 27, 8:00 PM",
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
        <div className="sm:pt-[80px] touch-pan-y">
          <Carousel
            showThumbs={false}
            autoPlay
            infiniteLoop
            showStatus={false}
            interval={4000}
            showArrows={false}
            onChange={(index) => setCurrentSlide(index)}
            swipeable={true}
            preventMovementUntilSwipeScrollTolerance={true}
            swipeScrollTolerance={50}
            emulateTouch={true}
          >
            {sliderData.map((item, index) => (
              <div
                key={index}
                className="relative"
                style={{ touchAction: "pan-y" }}
              >
                {/* Matte background for each slide */}
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage: `url(${item.image})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    filter: "brightness(0.5) blur(8px)",
                  }}
                ></div>

                {/* Slide content */}
                <div className="relative z-10 flex flex-col lg:flex-row items-stretch justify-start px-4 sm:px-8 lg:px-72 py-6 sm:py-10">
                  <div className="lg:w-[50%] w-full h-[400px] mr-4">
                    <img
                      src={item.image}
                      alt={`Event ${index + 1}`}
                      className="w-full h-full object-cover rounded-md shadow-lg"
                    />
                  </div>
                  <div className="lg:w-[65%] w-full lg:pl-6 flex flex-col justify-center text-left h-full py-6 text-white">
                    <h2 className="text-4xl font-bold mb-3">{item.title}</h2>
                    <p className="text-xl mb-2">{item.location}</p>
                    <p className="text-lg text-gray-300">{item.dateTime}</p>
                    <button className="mt-6 bg-white text-black px-8 py-3 rounded-full font-semibold hover:bg-gray-300 transition-all duration-200 w-fit">
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

      <div className="flex flex-wrap my-5 justify-center gap-3">
        {repeatedEvents.map((event, index) => (
          <div
            key={index}
            className=" rounded-lg overflow-hidden shadow-lg border border-[0.1px] hover:border-white hover:bg-white/10 hover:cursor-pointer transition-all duration-300 sm:w-[90%]"
            style={{ width: window.innerWidth <= 768 ? "88%" : `${width}px` }}
          >
            <div className="relative">
              {/* Image */}
              <img
                className="w-full object-cover"
                style={{ height: "35rem" }}
                src={event.image}
                alt={event.name}
              />
              <span className="flex items-center justify-center absolute top-2 bg-white right-4 border border-white/20 text-black text-sm px-4 py-1 rounded-full shadow-md">
                <Calendar className="w-3 h-3 mr-2" />
                More Dates
              </span>

              {/* Title container with black bg + gradient top */}
              <div className="absolute inset-x-0 bottom-0">
                <div className="relative bg-black">
                  <div className="absolute -top-[17.5rem] left-0 right-0 h-[17.5rem] bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10"></div>
                  {/* Day/Time badge (anchored ABOVE this block) */}
                  <span className="absolute -top-12 left-5 border border-white/20 text-white text-sm text-2x1 px-3 py-2 rounded shadow-md z-20">
                    {event.date}
                  </span>

                  {/* Gradient only for text block */}
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
