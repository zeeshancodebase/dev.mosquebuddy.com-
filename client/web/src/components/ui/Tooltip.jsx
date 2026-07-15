"use client";

import { useState, useRef, useEffect } from "react";
import { clsx } from "clsx";

export default function Tooltip({
  content,
  children,
  position = "top",
  delay = 300,
}) {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timerRef = useRef(null);

  function show() {
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }

  function hide() {
    clearTimeout(timerRef.current);
    setVisible(false);
  }

  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return;

    const trigger = triggerRef.current.getBoundingClientRect();
    const tooltip = tooltipRef.current.getBoundingClientRect();

    const GAP = 8;
    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = trigger.top - tooltip.height - GAP;
        left = trigger.left + trigger.width / 2 - tooltip.width / 2;
        break;

      case "bottom":
        top = trigger.bottom + GAP;
        left = trigger.left + trigger.width / 2 - tooltip.width / 2;
        break;

      case "left":
        top = trigger.top + trigger.height / 2 - tooltip.height / 2;
        left = trigger.left - tooltip.width - GAP;
        break;

      case "right":
        top = trigger.top + trigger.height / 2 - tooltip.height / 2;
        left = trigger.right + GAP;
        break;
    }
    // Keep within viewport horizontally
    const viewportWidth = window.innerWidth;
    if (left < 8) left = 8;
    if (left + tooltip.width > viewportWidth - 8) {
      left = viewportWidth - tooltip.width - 8;
    }

    setCoords({ top, left });
  }, [visible, position]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  if (!content) return children;

  const arrowClass = {
    top: "bottom-[-4px] left-1/2 -translate-x-1/2 border-t-gray-900 border-l-transparent border-r-transparent border-b-transparent",
    bottom:
      "top-[-4px] left-1/2 -translate-x-1/2 border-b-gray-900 border-l-transparent border-r-transparent border-t-transparent",
    left: "right-[-4px] top-1/2 -translate-y-1/2 border-l-gray-900 border-t-transparent border-b-transparent border-r-transparent",
    right:
      "left-[-4px] top-1/2 -translate-y-1/2 border-r-gray-900 border-t-transparent border-b-transparent border-l-transparent",
  };

  return (
    <>
      {/* Trigger */}
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex"
      >
        {children}
      </span>

      {/* Tooltip portal-style — fixed position */}
      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
            pointerEvents: "none",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
        >
          <div
            className="relative px-3 py-2 rounded-lg text-xs font-medium text-white leading-relaxed max-w-xs"
            style={{
              background: "#111827",
              boxShadow:
                "0 4px 16px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.15)",
              backdropFilter: "blur(8px)",
            }}
          >
            {content}
            {/* Arrow */}
            <span
              className={clsx(
                "absolute w-0 h-0 border-4",
                arrowClass[position],
              )}
            />
          </div>
        </div>
      )}
    </>
  );
}
