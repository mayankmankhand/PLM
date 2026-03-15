// Thinking/loading indicator shown while the AI is generating a response.
// Cycles through playful PLM-themed phrases on a 2.5-second interval.
// Phrases are Fisher-Yates shuffled on mount so the order feels random each time.
// Each phrase swap uses a React `key` change to retrigger a CSS slide-up animation.

"use client";

import { useState, useEffect, memo } from "react";

// PLM-themed phrases displayed while the user waits.
// No trailing "..." here - the animated dots handle that visually.
const PHRASES = [
  "Spinning the requirements web",
  "Wiring up the traceability matrix",
  "Herding test cases",
  "Flipping through approval chains",
  "Dusting off the audit logs",
  "Consulting the lifecycle gods",
  "Summoning the review board",
  "Defrosting frozen test runs",
  "Negotiating with the change control board",
  "Reverse-engineering the spec",
  "Chasing down rogue test failures",
  "Pleading with the approval workflow",
  "Unboxing the verification report",
  "Bribing the QA gatekeepers",
];

/**
 * Fisher-Yates shuffle - produces a random permutation of the input array.
 * Returns a new array (does not mutate the original).
 */
function shuffle(arr: string[]): string[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function ThinkingIndicatorBase() {
  // Shuffle phrases once on mount so the cycle order is unique per render.
  const [shuffled] = useState(() => shuffle(PHRASES));
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cycle to the next phrase every 2.5 seconds.
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shuffled.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [shuffled.length]);

  const currentPhrase = shuffled[currentIndex];

  return (
    <div className="max-w-3xl min-h-[24px]" role="status" aria-label="AI is thinking">
      <div className="flex items-center gap-2 text-[14px] text-text italic">
        {/* key={currentIndex} forces React to remount the span on each phrase change,
            retriggering the thinking-text CSS animation (slide-up-and-fade-in). */}
        <span key={currentIndex} className="thinking-text">
          {currentPhrase}
        </span>
        {/* Three animated dots using the existing streaming-dots CSS class. */}
        <span className="streaming-dots" aria-hidden="true">
          <span /><span /><span />
        </span>
      </div>
    </div>
  );
}

// Memoized to avoid unnecessary re-renders (matches MessageBubble pattern).
const ThinkingIndicator = memo(ThinkingIndicatorBase);
ThinkingIndicator.displayName = "ThinkingIndicator";

export { ThinkingIndicator };
