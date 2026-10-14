import { useEffect, useState } from "react";

export default function useScreenSize() {
  const [windowWidth, setWindowWidth] = useState(0);
  const isMobile = windowWidth < 500;
  const isTablet = windowWidth >= 500 && windowWidth < 1280;
  const isDesktop = windowWidth >= 1280;

  useEffect(() => {
    const handleResize = () => { setWindowWidth(window.innerWidth)};

    handleResize(); 
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    windowWidth,
    isMobile,
    isTablet,
    isDesktop
    };
};
