// src/components/ui/SearchableSelect.jsx
"use client";

import { useState, useRef, useEffect, useId } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";
import clsx from "clsx";

/**
 * SearchableSelect
 *
 * Drop-in replacement for <Select> when the options list is long.
 * Supports single-select only (multi-select is a separate component).
 *
 * Props:
 *   label         string             — field label
 *   placeholder   string             — shown when nothing selected
 *   searchPlaceholder string         — placeholder inside the search box
 *   options       { value, label }[] — the full option list
 *   value         string             — controlled selected value
 *   onChange      (value) => void    — called with the selected value string
 *   hint          string             — helper text below the field
 *   error         string             — error message; triggers red border
 *   disabled      boolean
 *   required      boolean
 *   clearable     boolean            — show × to clear selection (default true)
 *   emptyMessage  string             — shown when search yields no results
 *   className     string             — extra classes on the root wrapper
 */
export default function SearchableSelect({
  label,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  options = [],
  value,
  onChange,
  hint,
  error,
  disabled = false,
  required = false,
  clearable = true,
  emptyMessage = "No options match your search.",
  className,
}) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handle(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  const selectedOption = options.find((o) => o.value === value) ?? null;

  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : options;

  function handleToggle() {
    if (disabled) return;
    setOpen((prev) => {
      if (prev) setQuery("");
      return !prev;
    });
  }

  function handleSelect(optValue) {
    onChange?.(optValue);
    setOpen(false);
    setQuery("");
  }

  function handleClear(e) {
    e.stopPropagation();
    onChange?.("");
  }

  // Keyboard: Escape closes, Enter selects highlighted
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      setQuery("");
    }
  }

  const triggerBorderClass = error
    ? "border-red-400 focus-within:ring-red-200 focus-within:border-red-500"
    : open
    ? "border-emerald-500 ring-2 ring-emerald-100"
    : "border-gray-200 hover:border-gray-300";

  return (
    <div className={clsx("flex flex-col gap-1", className)} ref={containerRef}>
      {/* Label */}
      {label && (
        <label
          htmlFor={uid}
          className="text-sm font-medium text-gray-700 select-none"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <div className="relative">
        <button
          id={uid}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={handleToggle}
          className={clsx(
            "w-full flex items-center justify-between gap-2",
            "rounded-lg border bg-white px-3 py-2 text-sm transition-all duration-150",
            "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed cursor-pointer",
            triggerBorderClass
          )}
        >
          <span
            className={clsx(
              "truncate text-left",
              selectedOption ? "text-gray-900" : "text-gray-400"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>

          <span className="flex items-center gap-1 shrink-0">
            {/* Clear button */}
            {clearable && selectedOption && !disabled && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Clear selection"
                onClick={handleClear}
                onKeyDown={(e) => e.key === "Enter" && handleClear(e)}
                className="rounded p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X size={13} />
              </span>
            )}
            <ChevronDown
              size={15}
              className={clsx(
                "text-gray-400 transition-transform duration-200",
                open && "rotate-180"
              )}
            />
          </span>
        </button>

        {/* Dropdown panel */}
        {open && (
          <div
            className={clsx(
              "absolute z-50 mt-1 w-full",
              "rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-100/80",
              "overflow-hidden"
            )}
            onKeyDown={handleKeyDown}
          >
            {/* Search box */}
            <div className="p-2 border-b border-gray-100">
              <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                <Search size={13} className="text-gray-400 shrink-0" />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Options list */}
            <ul
              ref={listRef}
              role="listbox"
              className="max-h-56 overflow-y-auto py-1"
            >
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-gray-400">
                  {emptyMessage}
                </li>
              ) : (
                filtered.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <li
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      className={clsx(
                        "flex items-center justify-between gap-2",
                        "mx-1 rounded-lg px-3 py-2 text-sm cursor-pointer select-none transition-colors duration-100",
                        isSelected
                          ? "bg-emerald-50 text-emerald-700 font-medium"
                          : "text-gray-700 hover:bg-gray-50"
                      )}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && (
                        <Check size={13} className="text-emerald-600 shrink-0" />
                      )}
                    </li>
                  );
                })
              )}
            </ul>

            {/* Count footer */}
            {options.length > 0 && (
              <div className="border-t border-gray-100 px-3 py-1.5">
                <p className="text-xs text-gray-400">
                  {filtered.length === options.length
                    ? `${options.length} option${options.length !== 1 ? "s" : ""}`
                    : `${filtered.length} of ${options.length} match${filtered.length !== 1 ? "es" : ""}`}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hint / Error */}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}