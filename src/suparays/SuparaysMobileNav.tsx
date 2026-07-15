import React from "react";

export type SuparaysMobileNavId = "home" | "progress" | "chat" | "ideas";

interface SuparaysMobileNavProps {
  active: SuparaysMobileNavId;
  onSelect: (id: SuparaysMobileNavId) => void;
}

const ITEMS: { id: SuparaysMobileNavId; label: string; short: string }[] = [
  { id: "home", label: "Översikt", short: "Hem" },
  { id: "progress", label: "Framsteg", short: "Fas" },
  { id: "chat", label: "Chat", short: "Chat" },
  { id: "ideas", label: "Idébox", short: "Idéer" },
];

export default function SuparaysMobileNav({ active, onSelect }: SuparaysMobileNavProps) {
  return (
    <nav className="suparays-mobile-nav" aria-label="Huvudnavigering">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`suparays-mobile-nav-item${active === item.id ? " active" : ""}`}
          onClick={() => onSelect(item.id)}
          aria-current={active === item.id ? "page" : undefined}
        >
          <span className="suparays-mobile-nav-short">{item.short}</span>
          <span className="suparays-mobile-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
