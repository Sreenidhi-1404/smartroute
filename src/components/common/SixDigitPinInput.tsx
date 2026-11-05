import React, { useRef, useEffect } from 'react';

interface SixDigitPinInputProps {
  value: string;
  onChange: (pin: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  autoFocus?: boolean;
  masked?: boolean;
}

export const SixDigitPinInput: React.FC<SixDigitPinInputProps> = ({
  value,
  onChange,
  disabled = false,
  hasError = false,
  autoFocus = true,
  masked = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Array of 6 characters
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '');
    if (!char) {
      // Cleared
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      return;
    }

    // Take last digit typed if multiple
    const digit = char.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    const newPin = newDigits.join('');
    onChange(newPin);

    // Auto focus next box if available
    if (index < 5 && digit) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-2.5">
      {digits.map((digit, index) => {
        const isFilled = !!digit;
        return (
          <input
            key={index}
            ref={el => {
              inputRefs.current[index] = el;
            }}
            type={masked ? 'password' : 'text'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={digit}
            onChange={e => handleChange(index, e)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            className={`w-11 h-14 sm:w-12 sm:h-16 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border-2 transition-all outline-hidden shadow-xs ${
              hasError
                ? 'border-rose-400 bg-rose-50/50 text-rose-700 animate-shake focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                : isFilled
                ? 'border-blue-600 bg-blue-50/30 text-blue-950 font-black'
                : 'border-slate-300 bg-white text-slate-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 hover:border-slate-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
            placeholder="•"
          />
        );
      })}
    </div>
  );
};
