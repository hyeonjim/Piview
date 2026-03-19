"use client";

import { Search, X } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ value, onChange, placeholder = "검색...", className = "" }: SearchBarProps) {
  return (
    <div className={`relative w-full ${className}`}>
      <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#C4BEB7", pointerEvents: "none" }} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: "38px",
          paddingLeft: "36px",
          paddingRight: value ? "34px" : "12px",
          borderRadius: "8px",
          border: `1px solid ${value ? "#C4BEB7" : "#EDEBE8"}`,
          backgroundColor: "#FAFAF8",
          fontSize: "13px",
          color: "#1C1C1E",
          outline: "none",
          boxSizing: "border-box",
          transition: "border-color 0.15s",
        }}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="flex items-center justify-center cursor-pointer border-none"
          style={{
            position: "absolute",
            right: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            backgroundColor: "#D9D5D0",
          }}
        >
          <X size={10} style={{ color: "#FFFFFF" }} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
