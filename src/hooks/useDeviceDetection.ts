import { useState, useEffect, useCallback } from "react";

export interface DeviceDetection {
  isMobile: boolean; // < 768px
  isTablet: boolean; // 768px - 1023px
  isDesktop: boolean; // >= 1024px
  width: number;
  height: number;
  isTouch: boolean;
  orientation: "portrait" | "landscape";
}

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getDeviceInfo(): Omit<DeviceDetection, "orientation"> {
  if (typeof window === "undefined") {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 1024,
      height: 768,
      isTouch: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width < MOBILE_BREAKPOINT;
  const isTablet = width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT;
  const isDesktop = width >= TABLET_BREAKPOINT;

  // Detect touch capability
  const isTouch =
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    (navigator.msMaxTouchPoints && navigator.msMaxTouchPoints > 0);

  return {
    isMobile,
    isTablet,
    isDesktop,
    width,
    height,
    isTouch,
  };
}

export function useDeviceDetection(): DeviceDetection {
  const [deviceInfo, setDeviceInfo] = useState<
    Omit<DeviceDetection, "orientation">
  >(() => getDeviceInfo());

  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    () => {
      if (typeof window === "undefined") return "landscape";
      return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
    }
  );

  useEffect(() => {
    const handleResize = debounce(() => {
      const newInfo = getDeviceInfo();
      setDeviceInfo(newInfo);
      setOrientation(
        window.innerWidth > window.innerHeight ? "landscape" : "portrait"
      );
    }, 150); // Debounce resize events

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  return {
    ...deviceInfo,
    orientation,
  };
}
