import React from "react";

export type SpaceMobileNavId = "home" | "progress" | "chat" | "ideas";

interface SpaceMobileNavProps {
  active: SpaceMobileNavId;
  onSelect: (id: SpaceMobileNavId) => void;
}

const ITEMS: { id: SpaceMobileNavId; label: string; short: string }[] = [
  { id: "home", label: "Översikt", short: "Hem" },
  { id: "progress", label: "Framsteg", short: "Fas" },
  { id: "chat", label: "Chat", short: "Chat" },
  { id: "ideas", label: "Idébox", short: "Idéer" },
];

export default function SpaceMobileNav({ active, onSelect }: SpaceMobileNavProps) {
  return (
    <nav className="space-mobile-nav" aria-label="Huvudnavigering">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`space-mobile-nav-item${active === item.id ? " active" : ""}`}
          onClick={() => onSelect(item.id)}
          aria-current={active === item.id ? "page" : undefined}
        >
          <span className="space-mobile-nav-short">{item.short}</span>
          <span className="space-mobile-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
