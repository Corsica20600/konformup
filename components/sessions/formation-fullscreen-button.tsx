"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function FormationFullscreenButton() {
  const [active, setActive] = useState(false);
  async function toggle() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        setActive(false);
      } else {
        await document.documentElement.requestFullscreen();
        setActive(true);
      }
    } catch {
      setActive(Boolean(document.fullscreenElement));
    }
  }
  return <Button type="button" variant="secondary" onClick={toggle}>{active ? "Quitter le plein écran" : "Plein écran"}</Button>;
}
