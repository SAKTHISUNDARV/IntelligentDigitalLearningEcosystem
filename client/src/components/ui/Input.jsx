// components/ui/Input.jsx — Form input with label, hint, error, and icon support
import { forwardRef } from 'react';

const Input = forwardRef(({
    label,
    hint,
    error,
    icon: Icon,
    iconRight: IconRight,
    className = '',
    wrapperClass = '',
    ...props
}, ref) => {
    return (
        <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
            {label && (
                <label className="text-sm font-medium text-[var(--text-primary)]">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none">
                        <Icon size={16} />
                    </span>
                )}
                <input
                    ref={ref}
                    className={`
            w-full h-11 rounded-xl px-4 text-sm
            bg-[var(--surface-2)] text-[var(--text-primary)]
            border border-[var(--border)] transition-all duration-200 outline-none
            placeholder:text-[var(--text-muted)]
            ${error
                            ? 'border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                            : 'focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white shadow-sm shadow-transparent focus:shadow-indigo-500/5'
                        }
            ${Icon ? 'pl-11' : ''}
            ${IconRight ? 'pr-11' : ''}
            ${className}
          `}
                    {...props}
                />
                {IconRight && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                        {IconRight}
                    </span>
                )}
            </div>
            {hint && !error && (
                <p className="text-xs text-[var(--text-muted)]">{hint}</p>
            )}
            {error && (
                <p className="text-xs text-red-500">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

// Textarea variant
export function Textarea({ label, hint, error, className = '', wrapperClass = '', ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
            {label && (
                <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
            )}
            <textarea
                className={`
          w-full rounded-lg px-3 py-2.5 text-sm
          bg-[var(--surface-2)] text-[var(--text-primary)]
          border transition-all duration-150 outline-none resize-none
          placeholder:text-[var(--text-muted)]
          ${error
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-[var(--border)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }
          ${className}
        `}
                rows={3}
                {...props}
            />
            {hint && !error && <p className="text-xs text-[var(--text-muted)]">{hint}</p>}
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

// Select variant
export function Select({ label, hint, error, className = '', wrapperClass = '', children, ...props }) {
    return (
        <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
            {label && (
                <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
            )}
            <select
                className={`
          w-full h-10 rounded-lg px-3 text-sm
          bg-[var(--surface-2)] text-[var(--text-primary)]
          border transition-all duration-150 outline-none cursor-pointer
          ${error
                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                        : 'border-[var(--border)] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
                    }
          ${className}
        `}
                {...props}
            >
                {children}
            </select>
            {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
    );
}

export default Input;
