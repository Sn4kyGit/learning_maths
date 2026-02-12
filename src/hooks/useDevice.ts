import { useState, useEffect } from 'react';

/**
 * Custom hook for device detection.
 * Returns true if the viewport width is below 768px (common mobile/tablet threshold).
 */
export const useDevice = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return { isMobile };
};
