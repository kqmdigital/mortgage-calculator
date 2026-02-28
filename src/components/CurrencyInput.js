import { useRef, useLayoutEffect, forwardRef } from 'react';

const formatCurrencyInput = (value) => {
  if (value === '' || value === null || value === undefined) return '';
  const num = parseFloat(value.toString().replace(/,/g, ''));
  if (isNaN(num)) return '';
  return num.toLocaleString();
};

const CurrencyInput = forwardRef(({ value, onChange, ...props }, _) => {
  const inputRef = useRef(null);
  const cursorRef = useRef(null);

  useLayoutEffect(() => {
    if (inputRef.current && cursorRef.current !== null) {
      inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
      cursorRef.current = null;
    }
  }, [value]);

  const handleChange = (e) => {
    const cursorPos = e.target.selectionStart;
    const newRaw = e.target.value.replace(/[^0-9.]/g, '');

    // Count digit chars before cursor in the typed value (ignoring commas)
    const digitsBefore = e.target.value.slice(0, cursorPos).replace(/[^0-9.]/g, '').length;

    // Find the equivalent cursor position in the new formatted string
    const newFormatted = formatCurrencyInput(newRaw);
    let digits = 0;
    let newPos = newFormatted.length;
    for (let i = 0; i < newFormatted.length; i++) {
      if (/[0-9.]/.test(newFormatted[i])) {
        digits++;
        if (digits === digitsBefore) {
          newPos = i + 1;
          break;
        }
      }
    }

    cursorRef.current = newPos;
    onChange(newRaw);
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={formatCurrencyInput(value)}
      onChange={handleChange}
      {...props}
    />
  );
});

CurrencyInput.displayName = 'CurrencyInput';
export default CurrencyInput;
