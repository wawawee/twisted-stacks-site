import React from "react";

export type MobileNavId = "home" | "trading" | "chat" | "ideas";

interface AteMobileNavProps {
  active: MobileNavId;
  onSelect: (id: MobileNavId) => void;
}

const ITEMS: { id: MobileNavId; label: string; short: string }[] = [
  { id: "home", label: "Översikt", short: "Hem" },
  { id: "trading", label: "Terminal", short: "Trade" },
  { id: "chat", label: "Chat", short: "Chat" },
  { id: "ideas", label: "Idébox", short: "Idéer" },
];

export default function AteMobileNav({ active, onSelect }: AteMobileNavProps) {
  return (
    <nav className="ate-mobile-nav" aria-label="Huvudnavigering">
      {ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`ate-mobile-nav-item${active === item.id ? " active" : ""}`}
          onClick={() => onSelect(item.id)}
          aria-current={active === item.id ? "page" : undefined}
        >
          <span className="ate-mobile-nav-short">{item.short}</span>
          <span className="ate-mobile-nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
