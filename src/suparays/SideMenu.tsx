import React from "react";
import type { MenuItem, ViewMode } from "./viewMode";

interface SideMenuProps {
  items: MenuItem[];
  activeId: string | null;
  viewMode: ViewMode;
  isDark: boolean;
  onToggleTheme: () => void;
  onSelect: (item: MenuItem) => void;
  onToggleView: () => void;
  onRefresh: () => void;
  onLogout?: () => void;
  syncedAt: string | null;
  brandLabel?: string;
  /** ATE: TRADE lives next to theme / logout */
  onTrade?: () => void;
  tradeActive?: boolean;
}

export default function SideMenu({
  items,
  activeId,
  viewMode,
  isDark,
  onToggleTheme,
  onSelect,
  onToggleView,
  onRefresh,
  onLogout,
  syncedAt,
  brandLabel = "SUPARAYS",
  onTrade,
  tradeActive,
}: SideMenuProps) {
  const sections = [
    { key: "overview", label: "Start" },
    { key: "wiki", label: "Wiki" },
    { key: "progress", label: "Progress" },
    { key: "tools", label: "Verktyg" },
  ] as const;

  return (
    <aside className="room-menu">
      <div className="room-menu-head">
        <h1>{brandLabel}</h1>
        <p className="room-menu-meta">
          {viewMode === "dev" ? "DEV" : "COMPANY"}
          {syncedAt ? ` · ${new Date(syncedAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}` : ""}
        </p>
      </div>

      <div className="room-toggle-row">
        <button
          type="button"
          className={`room-toggle${viewMode === "company" ? " active" : ""}`}
          onClick={() => viewMode !== "company" && onToggleView()}
        >
          Företag
        </button>
        <button
          type="button"
          className={`room-toggle${viewMode === "dev" ? " active" : ""}`}
          onClick={() => viewMode !== "dev" && onToggleView()}
        >
          Dev
        </button>
      </div>

      <nav className="room-menu-nav">
        {sections.map((sec) => {
          const secItems = items.filter((i) => i.section === sec.key);
          if (secItems.length === 0) return null;
          return (
            <div key={sec.key} className="room-menu-group">
              <div className="room-menu-label">{sec.label}</div>
              {secItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`room-menu-item${activeId === item.id ? " active" : ""}`}
                  onClick={() => onSelect(item)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      <div className="room-menu-foot">
        {onTrade ? (
          <button
            type="button"
            className={`room-btn ate-menu-trade${tradeActive ? " active" : ""}`}
            onClick={onTrade}
          >
            TRADE
          </button>
        ) : null}
        <button
          type="button"
          className="room-theme-toggle"
          onClick={onToggleTheme}
          aria-pressed={isDark}
          aria-label={isDark ? "Byt till ljust läge" : "Byt till mörkt läge"}
        >
          <span className={`room-theme-knob${!isDark ? " dark" : ""}`} />
          <span className="room-theme-label">{isDark ? "Light" : "Dark"}</span>
        </button>
        <button type="button" className="room-btn" onClick={onRefresh}>
          Synka
        </button>
        {onLogout ? (
          <button type="button" className="room-btn room-btn-muted" onClick={onLogout}>
            Logga ut
          </button>
        ) : null}
      </div>
    </aside>
  );
}
