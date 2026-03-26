// components/ui/Card.jsx — Surface card with padding and hover variants
export default function Card({ children, className = '', hover = false, padding = true, variant = 'default', ...props }) {
    return (
        <div
            className={`
        bg-[var(--surface)] border border-slate-200/60 rounded-2xl
        transition-all duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.02)]
        ${hover ? 'hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 hover:border-indigo-100 cursor-pointer' : ''}
        ${padding ? 'p-6' : ''}
        ${variant === 'glass' ? 'glass-card' : ''}
        ${className}
      `}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = '' }) {
    return (
        <div className={`flex items-center justify-between mb-5 ${className}`}>
            {children}
        </div>
    );
}

export function CardTitle({ children, className = '' }) {
    return (
        <h3 className={`text-base font-semibold text-[var(--text-primary)] ${className}`}>
            {children}
        </h3>
    );
}

export function StatCard({ label, value, sub, icon: Icon, color = 'indigo' }) {
    const colors = {
        indigo: { text: 'text-indigo-600', dot: 'bg-indigo-500' },
        teal: { text: 'text-teal-600', dot: 'bg-teal-500' },
        amber: { text: 'text-amber-600', dot: 'bg-amber-500' },
        rose: { text: 'text-rose-600', dot: 'bg-rose-500' },
        violet: { text: 'text-violet-600', dot: 'bg-violet-500' },
        cyan: { text: 'text-cyan-600', dot: 'bg-cyan-500' },
    };
    const c = colors[color] || colors.indigo;

    return (
        <Card className="anim-fade-up border-slate-200/60 shadow-sm overflow-hidden relative">
            <div className="flex items-start justify-between relative z-10">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={`w-1 h-1 rounded-full ${c.dot}`} />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-800 leading-none tracking-tight">{value ?? '—'}</p>
                    {sub && <p className="text-[11px] font-medium text-slate-400 mt-2 truncate">{sub}</p>}
                </div>
                {Icon && (
                    <div className="flex-shrink-0">
                        <Icon size={20} className={c.text} strokeWidth={1.5} />
                    </div>
                )}
            </div>
        </Card>
    );
}
