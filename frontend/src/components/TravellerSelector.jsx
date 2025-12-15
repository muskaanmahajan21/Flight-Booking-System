import { useState } from "react";

const CABIN_CLASSES = [
  "Economy",
  "Premium Economy",
  "Business",
  "First Class",
];

export default function TravellerSelector({ initial, onApply }) {
  const [adults, setAdults] = useState(initial.adults);
  const [children, setChildren] = useState(initial.children);
  const [cabin, setCabin] = useState(initial.cabin);

  return (
    <div className="w-80 bg-white rounded-2xl shadow-xl p-4 border">

      <h3 className="font-semibold mb-3">Travellers</h3>

      {/* ADULTS */}
      <div className="flex justify-between items-center mb-3">
        <span>Adults</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAdults(Math.max(1, adults - 1))}
            className="px-3 py-1 border rounded"
          >
            −
          </button>
          <span>{adults}</span>
          <button
            onClick={() => setAdults(adults + 1)}
            className="px-3 py-1 border rounded"
          >
            +
          </button>
        </div>
      </div>

      {/* CHILDREN */}
      <div className="flex justify-between items-center mb-4">
        <span>Children</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setChildren(Math.max(0, children - 1))}
            className="px-3 py-1 border rounded"
          >
            −
          </button>
          <span>{children}</span>
          <button
            onClick={() => setChildren(children + 1)}
            className="px-3 py-1 border rounded"
          >
            +
          </button>
        </div>
      </div>

      {/* CABIN CLASS */}
      <h3 className="font-semibold mb-2">Cabin Class</h3>

      <div className="space-y-2 mb-4">
        {CABIN_CLASSES.map((c) => (
          <label key={c} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={cabin === c}
              onChange={() => setCabin(c)}
            />
            {c}
          </label>
        ))}
      </div>

      <button
        onClick={() =>
          onApply({
            adults,
            children,
            cabin,
          })
        }
        className="w-full bg-sky-600 text-white py-2 rounded-lg font-semibold"
      >
        Apply
      </button>
    </div>
  );
}
