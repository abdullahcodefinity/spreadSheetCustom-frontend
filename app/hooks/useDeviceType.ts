// useDeviceType.ts
import { useState, useEffect } from 'react';
import { DeviceType } from '../types';



const useDeviceType = (): DeviceType => {
  const [deviceType, setDeviceType] = useState<DeviceType>({});

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Common breakpoints:
      // Mobile: < 768px
      // Tablet: 768px - 1024px
      // Monitor: > 1024px
      
      if (width < 768) {
        setDeviceType({ mobile: true });
      } else if (width >= 768 && width <= 1024) {
        setDeviceType({ tab: true });
      } else {
        setDeviceType({ monitor: true });
      }
    };

    // Initial check
    handleResize();

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return deviceType;
};

export default useDeviceType;