import { useState, useEffect, useRef } from "react";

export const useZoomWidth = () => {
  const [width, setWidth] = useState(400);
  const lastZoomRef = useRef(1);

  useEffect(() => {
    const detectZoom = () => {
      // Reliable zoom detection
      const zoomX = window.outerWidth / window.innerWidth;
      const zoomY = window.outerHeight / window.innerHeight;
      const zoom = (zoomX + zoomY) / 2;

      // Find closest match from your zoom levels
      const zoomLevels = [1.875, 1.65, 1.5, 1.34, 1.2, 1.125, 1, 0.75, 0.67, 0.5, 0.33];
      return zoomLevels.reduce((prev, curr) => 
        Math.abs(curr - zoom) < Math.abs(prev - zoom) ? curr : prev
      );
    };

    const updateWidth = () => {
      const currentZoom = detectZoom();
      
      if (Math.abs(currentZoom - lastZoomRef.current) > 0.05) {
        lastZoomRef.current = currentZoom;
        
        const zoomMap = {
          1.875: 350, // 175
          1.65: 400, //150
          1.34: 320,  //125
          1.2: 365,  //110
          1.125: 400,  //100
          1: 332, //90
          0.75: 355, //67
          0.67: 350,
          0.5: 390,
          0.33: 580
        };

        const newWidth = zoomMap[currentZoom] || 400;
        setWidth(newWidth);
        console.log(`Zoom: ${currentZoom}x → Width: ${newWidth}px`);
      }
    };

    // Initial detection
    updateWidth();

    // Check every 200ms for zoom changes
    const interval = setInterval(updateWidth, 200);
    window.addEventListener('resize', updateWidth);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateWidth);
    };
  }, []);

  return width;
};