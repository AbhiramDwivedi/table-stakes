import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function TableStakesLogo({ className = "", size = "md" }: LogoProps) {
  // Sizing based on prop
  const dimensions = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
  };

  return (
    <div className={`relative ${dimensions[size]} ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0"
      >
        {/* Base shape - stylized table with cards on it */}
        <rect x="6" y="12" width="36" height="24" rx="2" fill="#3B82F6" />
        
        {/* Table surface effect */}
        <rect x="8" y="14" width="32" height="20" rx="1" fill="#2563EB" />
        
        {/* Card/data elements on table */}
        <rect x="12" y="18" width="10" height="6" rx="1" fill="#DBEAFE" />
        <rect x="26" y="18" width="10" height="6" rx="1" fill="#DBEAFE" />
        <rect x="12" y="26" width="10" height="6" rx="1" fill="#DBEAFE" />
        <rect x="26" y="26" width="10" height="6" rx="1" fill="#DBEAFE" />
        
        {/* Highlight effect */}
        <rect x="12" y="18" width="10" height="2" rx="1" fill="#93C5FD" />
        <rect x="26" y="18" width="10" height="2" rx="1" fill="#93C5FD" />
        
        {/* Data visualization element */}
        <path d="M14 21L16 20L18 22L20 19" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M28 21L30 19L32 23L34 20" stroke="#1D4ED8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
}