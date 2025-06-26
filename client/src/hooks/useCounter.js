import { useState, useCallback } from 'react';

/**
 * A custom hook for managing a counter state
 * @param {number} initialValue - The initial value for the counter
 * @returns {Object} An object containing the count, increment, decrement, and reset functions
 */
const useCounter = (initialValue = 0) => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount((prevCount) => prevCount + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount((prevCount) => prevCount - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
};

export default useCounter;