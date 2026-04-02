import React, { useState } from "react";

const PriceFilter = ({ onApply, onClose }) => {
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(5);

  const labels = ["Free", "$20", "$50", "$100", "$200", "∞"];

  return (
    <div className="bg-black text-white p-6 rounded-xl w-[90%] max-w-md relative">
      {/* Close (X) button in top right */}

      <h2 className="text-lg font-bold mb-4">Price</h2>

      {/* Labels */}
      <div className="flex justify-between text-sm font-medium mb-2">
        {labels.map((label, idx) => (
          <span key={idx}>{label}</span>
        ))}
      </div>

      {/* Slider */}
      <div className="relative h-8 flex items-center mb-6">
        {/* Base line */}
        <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gray-600"></div>

        {/* Highlight between thumbs */}
        <div
          className="absolute top-1/2 h-[2px] bg-blue-500"
          style={{
            left: `${(min / 5) * 100}%`,
            right: `${100 - (max / 5) * 100}%`,
          }}
        />

        {/* Tick marks */}
        <div className="absolute top-1/2 left-0 right-0 flex justify-between">
          {labels.map((_, idx) => (
            <div key={idx} className="w-[2px] h-3 bg-gray-400"></div>
          ))}
        </div>

        {/* Min thumb */}
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={min}
          onChange={(e) => setMin(Math.min(+e.target.value, max))}
          className="absolute w-full appearance-none bg-transparent pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:cursor-pointer
          "
          style={{ zIndex: min >= max ? 5 : 10 }}
        />

        {/* Max thumb */}
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={max}
          onChange={(e) => setMax(Math.max(+e.target.value, min))}
          className="absolute w-full appearance-none bg-transparent pointer-events-auto
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500
            [&::-webkit-slider-thumb]:cursor-pointer
          "
          style={{ zIndex: max > min ? 10 : 5 }}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            onClose();
            onApply([min, max]);
          }}
          className="flex-1 bg-blue-500 py-2 rounded-lg hover:bg-blue-600"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default PriceFilter;
