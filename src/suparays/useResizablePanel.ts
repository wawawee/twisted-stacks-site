import { useCallback, useEffect, useState } from "react";

const MIN = 280;
const MAX = 720;
const DEFAULT = 400;

export function useResizablePanel(storageKey = "suparays-panel-width") {
  const [width, setWidth] = useState(() => {
    const saved = localStorage.getItem(storageKey);
    const n = saved ? Number.parseInt(saved, 10) : DEFAULT;
    return Number.isFinite(n) ? Math.min(MAX, Math.max(MIN, n)) : DEFAULT;
  });
  const [dragging, setDragging] = useState(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  useEffect(() => {
    if (!dragging) return;

    function onMove(ev: PointerEvent) {
      const next = window.innerWidth - ev.clientX;
      setWidth(Math.min(MAX, Math.max(MIN, next)));
    }

    function onUp() {
      setDragging(false);
      setWidth((w) => {
        localStorage.setItem(storageKey, String(w));
        return w;
      });
    }

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, storageKey]);

  return { width, dragging, onPointerDown };
}
