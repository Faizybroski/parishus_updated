import React from "react";

const OurEventsCreate = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <div className="flex justify-center space-x-4 border-b border-gray-800 pb-4">
        <button className="px-6 py-2 rounded-full bg-gray-900 text-white">
          Sell Tickets
        </button>
        <button className="px-6 py-2 rounded-full bg-gray-800 text-gray-400">
          RSVP
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 p-6">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl font-semibold">My Event Name</h1>
          <button className="px-4 py-2 bg-gray-900 text-gray-400 rounded-md">
            Short Summary
          </button>

          <div>
            <p className="text-sm text-gray-400 mb-2">Dates</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">Start</span>
                <input
                  type="datetime-local"
                  className="bg-gray-900 rounded-md px-3 py-2 text-white"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500">End</span>
                <input
                  type="datetime-local"
                  className="bg-gray-900 rounded-md px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="flex justify-between items-center bg-gray-900 rounded-md px-3 py-2 mt-3">
              <span>Recurring Series</span>
              <select className="bg-gray-800 px-2 py-1 rounded text-sm">
                <option>No</option>
                <option>Yes</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Event Details</p>
            <input
              className="w-full bg-gray-900 rounded-md px-3 py-2 mb-2"
              placeholder="Add Description"
            />
            <input
              className="w-full bg-gray-900 rounded-md px-3 py-2 mb-2"
              placeholder="Location"
            />
            <input
              className="w-full bg-gray-900 rounded-md px-3 py-2"
              placeholder="Venue Name"
            />
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Tickets</p>
            <div className="flex justify-between bg-gray-900 rounded-md px-4 py-3">
              <span>Default Ticket</span>
              <span>$10.00</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Guestlist</p>
            <div className="bg-gray-900 rounded-md px-4 py-3">
              <span className="block mb-2 text-sm text-gray-300">
                David and 11 others going
              </span>
              <div className="flex space-x-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-gray-600"
                  ></div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Event Features</p>
            <button className="w-full bg-gray-900 text-gray-400 px-4 py-2 rounded-md">
              Add Feature
            </button>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">YouTube Video</p>
            <input
              className="w-full bg-gray-900 rounded-md px-3 py-2"
              placeholder="Add video from YouTube"
            />
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Image Gallery</p>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 bg-gray-900 rounded-md flex items-center justify-center text-gray-500"
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Page Settings</p>
            <div className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded-md mb-2">
              <span>Show on Explore</span>
              <input type="checkbox" className="w-5 h-5" />
            </div>
            <div className="flex justify-between items-center bg-gray-900 px-4 py-2 rounded-md">
              <span>Password Protected Event</span>
              <input type="checkbox" className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="lg:w-1/3 flex flex-col space-y-4">
          <div className="bg-gray-900 rounded-md flex items-center justify-center h-64">
            <button className="bg-gray-700 px-4 py-2 rounded-full">
              Upload your flyer
            </button>
          </div>
          <button className="bg-gray-900 rounded-md px-4 py-2 text-gray-300 text-left">
            Add song from Spotify
          </button>
          <select className="bg-gray-900 px-3 py-2 rounded-md text-gray-300">
            <option>Title Font</option>
          </select>
          <select className="bg-gray-900 px-3 py-2 rounded-md text-gray-300">
            <option>Accent Color</option>
          </select>
          <button className="bg-gray-700 rounded-md px-4 py-3 text-white font-semibold">
            Create Event
          </button>
        </div>
      </div>
    </div>
  );
};

export default OurEventsCreate;
