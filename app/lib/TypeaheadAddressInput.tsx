"use client";

import React, { useState, useEffect, useRef } from "react";
import { AddressSuggestion, filterAddressSuggestions } from "./address-suggestions";

export interface TypeaheadAddressInputProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  onSelect?: (suggestion: AddressSuggestion) => void;
  suggestions: AddressSuggestion[];
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  disabled?: boolean;
  style?: React.CSSProperties;
  inputStyle?: React.CSSProperties;
  className?: string;
  autoComplete?: string;
}

export function TypeaheadAddressInput({
  name,
  value,
  defaultValue = "",
  onChange,
  onSelect,
  suggestions,
  placeholder,
  required = false,
  maxLength,
  disabled = false,
  style,
  inputStyle,
  className,
  autoComplete = "off",
}: TypeaheadAddressInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(isControlled ? value : defaultValue);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentValue = isControlled ? value : internalValue;

  // Filter suggestions ONLY when user has typed at least 1 non-whitespace character
  const filteredSuggestions = filterAddressSuggestions(currentValue, suggestions, 8);

  useEffect(() => {
    if (isControlled) {
      setInternalValue(value);
    }
  }, [isControlled, value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!isControlled) {
      setInternalValue(val);
    }
    onChange?.(val);

    // Show dropdown only after typing 1 or more characters
    if (val.trim().length >= 1) {
      setIsOpen(true);
      setHighlightIndex(-1);
    } else {
      setIsOpen(false);
    }
  };

  const handleFocus = () => {
    // Strictly do not show on initial focus if empty
    if ((currentValue || "").trim().length >= 1 && filteredSuggestions.length > 0) {
      setIsOpen(true);
    }
  };

  const handleSelect = (item: AddressSuggestion) => {
    if (!isControlled) {
      setInternalValue(item.value);
    }
    onChange?.(item.value);
    onSelect?.(item);
    setIsOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (e.key === "ArrowDown" && (currentValue || "").trim().length >= 1) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev < filteredSuggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : filteredSuggestions.length - 1));
    } else if (e.key === "Enter") {
      if (highlightIndex >= 0 && highlightIndex < filteredSuggestions.length) {
        e.preventDefault();
        handleSelect(filteredSuggestions[highlightIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const showDropdown = isOpen && (currentValue || "").trim().length >= 1 && filteredSuggestions.length > 0;

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        ...style,
      }}
      className={className}
    >
      <input
        ref={inputRef}
        type="text"
        name={name}
        value={currentValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete={autoComplete}
        style={{
          width: "100%",
          boxSizing: "border-box",
          ...inputStyle,
        }}
      />

      {showDropdown && (
        <ul
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "8px",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)",
            maxHeight: "230px",
            overflowY: "auto",
            margin: 0,
            padding: "4px 0",
            listStyle: "none",
            textAlign: "left",
          }}
        >
          {filteredSuggestions.map((item, index) => {
            const isHighlighted = index === highlightIndex;
            return (
              <li
                key={`${item.value}-${index}`}
                role="option"
                aria-selected={isHighlighted}
                onMouseDown={(e) => {
                  // Prevent input blur before click finishes
                  e.preventDefault();
                  handleSelect(item);
                }}
                onMouseEnter={() => setHighlightIndex(index)}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  backgroundColor: isHighlighted ? "#f0fdf4" : "#ffffff",
                  borderLeft: isHighlighted ? "3px solid #16a34a" : "3px solid transparent",
                  transition: "background-color 0.12s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                }}
              >
                <div
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: isHighlighted ? "#15803d" : "#1e293b",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontSize: "11px", opacity: 0.7 }}>📍</span>
                  <span>{item.label || item.value}</span>
                </div>
                {item.sublabel && (
                  <div
                    style={{
                      fontSize: "10.5px",
                      color: "#64748b",
                      paddingLeft: "17px",
                    }}
                  >
                    {item.sublabel}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
export default TypeaheadAddressInput;
