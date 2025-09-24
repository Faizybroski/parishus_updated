import React, { useState, useEffect } from "react";
import { Carousel } from "react-responsive-carousel";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { ChevronDown, Calendar } from "lucide-react";
import PriceFilter from "@/components/filter/PriceFilter";
import ParishLogo from "@/components/ui/logo";

const OurExploreEvents = () => {
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [trending, setTrending] = useState("Trending");
  const [timeframe, setTimeframe] = useState("This Week");
  const [city, setCity] = useState("Los Angeles");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showFeatured, setShowFeatured] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 200]); // min and max
  const maxPrice = 1000; // or whatever ceiling you want
  const [width, setWidth] = useState(400); // default width

  const updateWidth = () => {
    setLoading(true);
    const zoom = window.devicePixelRatio; // 1 = 100%, 1.5 = 150%, etc.
    let newWidth = 400;

    if (zoom >= 1.5) newWidth = 375;
    else if (zoom >= 1.25) newWidth = 315;
    else if (zoom >= 1.1) newWidth = 350;
    else if (zoom >= 1.0) newWidth = 400;
    else if (zoom >= 0.9) newWidth = 325;
    else if (zoom >= 0.8) newWidth = 375;
    else if (zoom >= 0.75) newWidth = 390;
    else if (zoom >= 0.67) newWidth = 350;
    else if (zoom >= 0.5) newWidth = 390;
    else if (zoom >= 0.33) newWidth = 580;

    setWidth(newWidth);
    setTimeout(() => setLoading(false), 300);
  };

  useEffect(() => {
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

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

  const cardImages = [
    "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
    "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68c1cc6c01a7df1c857f9cee",
    "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-alts-production.s3.amazonaws.com/68bf6213ee6cfb687a56c36a/1400x1750.webp",
    "https://posh.vip/cdn-cgi/image/quality=85,fit=scale-down,format=webp,width=1920/https://posh-images-originals-production.s3.amazonaws.com/68a3b441145a5d2c323b60f0",
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <h1 className="parish-loader text-7xl font-extrabold">Parish</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#010101] text-white">
      <div className="w-full relative -mt-[2px]">
        {/* Nav ABOVE carousel */}
        <nav className="absolute top-0 left-0 w-full z-30 h-[80px]">
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
              <div className="flex items-center gap-5 bg-white/20 rounded-full px-4 py-2 backdrop-blur-md">
                {[
                  {
                    label: trending,
                    options: trendingOptions,
                    setter: setTrending,
                  },
                  {
                    label: timeframe,
                    options: timeframeOptions,
                    setter: setTimeframe,
                  },
                  {
                    label: city,
                    options: cityOptions,
                    setter: setCity,
                    city: true,
                  },
                ].map((menu, idx) => (
                  <div key={idx} className="relative">
                    <button
                      className="px-3 py-1 flex items-center gap-1 text-sm font-semibold text-white hover:text-gray-200"
                      onClick={() =>
                        setOpenDropdown(openDropdown === idx ? null : idx)
                      }
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
            </div>
          </div>
        </nav>

        {/* Carousel BELOW nav */}
        <div className="pt-[80px] touch-pan-y">
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
          <PriceFilter
            onApply={(selectedRange) => {
              setPriceRange(selectedRange);
              setFilterOpen(false);
            }}
            onClose={() => setFilterOpen(false)} // 👈 pass this too
          />
        </div>
      )}

      <div className="flex flex-wrap m-5 justify-center gap-3">
        {Array.from({ length: 42 }).map((_, index) => {
          const img = cardImages[index % cardImages.length];
          return (
            <div
              key={index}
              className="rounded-lg overflow-hidden shadow-lg border border-[0.1px] hover:border-white hover:bg-white/10 hover:cursor-pointer transition-all duration-300 w-[375px]"
              style={{ width: `${width}px` }}
            >
              <div className="relative">
                {/* Image */}
                <img
                  className="w-full object-cover"
                  style={{ height: "35rem" }}
                  src={img}
                  alt={`Event ${index + 1}`}
                />
                <span className="flex items-center justify-center absolute top-2 bg-white right-4 border border-white/20 text-black text-sm px-4 py-1 rounded-full shadow-md">
                  <Calendar className="w-3 h-3 mr-2" />
                  More Dates
                </span>

                {/* Title container with black bg + gradient top */}
                <div className="absolute inset-x-0 bottom-0">
                  <div className="relative bg-black">
                    {/* Day/Time badge (anchored ABOVE this block) */}
                    <span className="absolute -top-12 left-4 border border-white/20 text-white text-sm font-bold px-4 py-1 rounded shadow-md backdrop-blur-sm">
                      SAT - 8:00 PM
                    </span>

                    {/* Gradient only for text block */}
                    <div className="absolute -top-10 left-0 right-0 h-10 bg-gradient-to-t from-black to-transparent"></div>

                    <div className="p-5 relative z-10">
                      <h3 className="text-2xl font-bold text-white">
                        Dionysus: Casino Royale
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OurExploreEvents;
