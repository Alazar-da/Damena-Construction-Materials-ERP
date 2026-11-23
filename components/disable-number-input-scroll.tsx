'use client';

import { useEffect } from 'react';

/**
 * Prevents mouse wheel scrolling from inadvertently changing values
 * on number inputs across the entire application.
 */
export default function DisableNumberInputScroll() {
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === 'number') {
        active.blur();
      }
      const target = e.target;
      if (target instanceof HTMLInputElement && target.type === 'number') {
        target.blur();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  return null;
}
