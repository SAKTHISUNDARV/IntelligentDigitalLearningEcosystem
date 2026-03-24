// components/ui/Badge.jsx — Pill badge with semantic color variants
const variants = {
    default: 'bg-slate-100 text-slate-600 border border-slate-200',
    primary: 'bg-indigo-50 text-indigo-600 border border-indigo-200',
    success: 'bg-teal-50 text-teal-700 border border-teal-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-red-50 text-red-600 border border-red-200',
    info: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    purple: 'bg-violet-50 text-violet-700 border border-violet-200',
};

const sizes = {
    sm: 'text-[10px] px-2 py-0.5 rounded-md',
    md: 'text-xs px-2.5 py-1 rounded-lg',
};

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
    return (
        <span className={`
      inline-flex items-center gap-1 font-medium whitespace-nowrap
      ${variants[variant] ?? variants.default}
      ${sizes[size] ?? sizes.md}
      ${className}
    `}>
            {children}
        </span>
    );
}

// Dot indicator
export function StatusDot({ color = 'green' }) {
    const map = { green: 'bg-teal-500', amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-blue-500', gray: 'bg-slate-400' };
    return (
        <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${map[color]} opacity-60`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${map[color]}`} />
        </span>
    );
}
