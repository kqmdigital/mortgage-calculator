import { useEffect, useRef, useCallback } from 'react';

const useInactivityTimer = (onInactive, timeoutMs = 2 * 60 * 60 * 1000) => { // Default 2 hours
  const timeoutRef = useRef(null);
  const isActiveRef = useRef(true);

  // Events that indicate user activity
  const activityEvents = [
    'mousedown',
    'mousemove',
    'keypress',
    'scroll',
    'touchstart',
    'click',
    'keydown'
  ];

  const resetTimer = useCallback(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Update last activity timestamp
    sessionStorage.setItem('last_activity', Date.now().toString());
    isActiveRef.current = true;

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      isActiveRef.current = false;
      if (onInactive) {
        onInactive();
      }
    }, timeoutMs);
  }, [onInactive, timeoutMs]);

  const handleActivity = useCallback(() => {
    if (!isActiveRef.current) {
      // User became active again, reset timer
      resetTimer();
    } else {
      // Just update the timer
      resetTimer();
    }
  }, [resetTimer]);

  useEffect(() => {
    // Initialize timer on mount
    resetTimer();

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [handleActivity, resetTimer, activityEvents]);

  // Function to manually reset the timer (useful for API calls, etc.)
  const manualReset = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  // Function to check if user is currently active
  const isActive = useCallback(() => {
    return isActiveRef.current;
  }, []);

  // Function to get time remaining before timeout
  const getTimeRemaining = useCallback(() => {
    const lastActivity = parseInt(sessionStorage.getItem('last_activity') || '0');
    if (!lastActivity) return 0;

    const elapsed = Date.now() - lastActivity;
    const remaining = Math.max(0, timeoutMs - elapsed);
    return remaining;
  }, [timeoutMs]);

  return {
    resetTimer: manualReset,
    isActive,
    getTimeRemaining
  };
};

export default useInactivityTimer;