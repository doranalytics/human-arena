"use client";
import { useEffect } from "react";
import { closeMobileSidebar } from "./ui";

/** Safari's keyboard resizes the visual viewport, not the layout viewport. */
export function useMobileViewport() {
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const viewport = window.visualViewport;
    const root = document.documentElement;
    const update = () => {
      if (!media.matches) {
        root.style.removeProperty("--app-height");
        root.style.removeProperty("--app-top");
        closeMobileSidebar();
        return;
      }
      // Leave pinch zoom under browser control.
      if (viewport && viewport.scale !== 1) return;
      root.style.setProperty("--app-height", `${viewport?.height ?? window.innerHeight}px`);
      root.style.setProperty("--app-top", `${viewport?.offsetTop ?? 0}px`);
    };
    update();
    media.addEventListener("change", update);
    window.addEventListener("resize", update);
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    return () => {
      media.removeEventListener("change", update);
      window.removeEventListener("resize", update);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--app-top");
    };
  }, []);
}
