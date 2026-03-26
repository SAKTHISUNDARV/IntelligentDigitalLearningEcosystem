// components/ui/Button.jsx — Versatile button component with variants
import { forwardRef } from 'react';

const variants = {
  primary: `
    bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
    text-white shadow-sm shadow-indigo-100
    border border-indigo-600 hover:border-indigo-500
    hover:scale-[1.02] active:scale-[0.98]
  `,
  secondary: `
    bg-[var(--surface-2)] hover:bg-[var(--surface-3)]
    text-[var(--text-primary)] border border-[var(--border)]
    hover:scale-[1.02] active:scale-[0.98]
  `,
  ghost: `
    bg-transparent hover:bg-[var(--surface-2)]
    text-[var(--text-secondary)] hover:text-[var(--text-primary)]
    border border-transparent
    hover:scale-[1.02] active:scale-[0.98]
  `,
  danger: `
    bg-red-600 hover:bg-red-500 active:bg-red-700
    text-white border border-red-600 shadow-sm shadow-red-100
    hover:scale-[1.02] active:scale-[0.98]
  `,
  outline: `
    bg-transparent hover:bg-indigo-50
    text-indigo-600
    border border-indigo-200 hover:border-indigo-400
    hover:scale-[1.02] active:scale-[0.98]
  `,
};

const sizes = {
  sm: 'h-8  px-3  text-xs  gap-1.5 rounded-lg',
  md: 'h-9  px-4  text-sm  gap-2   rounded-lg',
  lg: 'h-11 px-5  text-sm  gap-2   rounded-xl',
  xl: 'h-12 px-6  text-base gap-2.5 rounded-xl',
  icon: 'h-9  w-9   text-sm  rounded-lg',
};

const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-150 cursor-pointer select-none
        disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
        focus-visible:ring-offset-[var(--bg)]
        ${variants[variant] ?? variants.primary}
        ${sizes[size] ?? sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="spinner w-4 h-4" />
      ) : children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
