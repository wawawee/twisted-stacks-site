import React from "react";
import type { MenuItem, ViewMode } from "./viewMode";
import { viewModeLabel } from "./viewMode";

interface SideMenuProps {
  items: MenuItem[];
  activeId: string | null;
  viewMode: ViewMode;
  isDark: boolean;
  onToggleTheme: () => void;
  onSelect: (item: MenuItem) => void;
  onSetViewMode: (mode: ViewMode) => void;
  onRefresh: () => void;
  onLogout?: () => void;
  syncedAt: string | null;
  brandLabel?: string;
  /** Which mode toggles to show (SUPARAYS = all three; ATE = company+dev) */
  availableModes?: ViewMode[];
  /** ATE: TRADE lives next to theme / logout */
  onTrade?: () => void;
  tradeActive?: boolean;
}

const VIEW_BUTTON_LABEL: Record<ViewMode, string> = {
  start: "Start",
  company: "Biz",
  dev: "Dev",
};

export default function SideMenu({
  items,
  activeId,
  viewMode,
  isDark,
  onToggleTheme,
  onSelect,
  onSetViewMode,
  onRefresh,
  onLogout,
  syncedAt,
  brandLabel = "SUPARAYS",
  availableModes = ["start", "company", "dev"],
  onTrade,
  tradeActive,
}: SideMenuProps) {
  const sections = [
    { key: "overview", label: "Start" },
    { key: "wiki", label: "Wiki" },
    { key: "progress", label: "Progress" },
    { key: "tools", label: "Verktyg" },
  ] as const;

  const modes = availableModes.length > 0 ? availableModes : (["company", "dev"] as ViewMode[]);

  return (
    <aside className="room-menu">
      <div className="room-menu-head">
        <h1>{brandLabel}</h1>
        <p className="room-menu-meta">
          {viewModeLabel(viewMode)}
          {syncedAt
            ? ` · ${new Date(syncedAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}`
            : ""}
        </p>
      </div>

      <div
        className={`room-toggle-row${modes.length === 3 ? " room-toggle-row-3" : ""}`}
        role="group"
        aria-label="Visningsläge"
      >
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            className={`room-toggle${viewMode === mode ? " active" : ""}`}
            onClick={() => viewMode !== mode && onSetViewMode(mode)}
          >
            {VIEW_BUTTON_LABEL[mode]}
          </button>
        ))}
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
