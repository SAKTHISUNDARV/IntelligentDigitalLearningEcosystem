import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const variants = {
  info: {
    Icon: Info,
    role: 'status',
    live: 'polite',
    shell: 'border-sky-200/90 bg-[linear-gradient(135deg,#f7fbff_0%,#eef6ff_100%)] text-slate-800 shadow-sm',
    iconWrap: 'bg-[linear-gradient(180deg,#4f8df9_0%,#2f6be0_100%)] text-white shadow-sm',
    close: 'text-sky-600/70 hover:bg-sky-100 hover:text-sky-800 focus-visible:ring-sky-300',
  },
  success: {
    Icon: CheckCircle2,
    role: 'status',
    live: 'polite',
    shell: 'border-emerald-200/90 bg-[linear-gradient(135deg,#f4fcf6_0%,#eef9f1_100%)] text-slate-800 shadow-sm',
    iconWrap: 'bg-[linear-gradient(180deg,#58c86c_0%,#37ad50_100%)] text-white shadow-sm',
    close: 'text-emerald-600/70 hover:bg-emerald-100 hover:text-emerald-800 focus-visible:ring-emerald-300',
  },
  warning: {
    Icon: AlertTriangle,
    role: 'alert',
    live: 'assertive',
    shell: 'border-amber-200/90 bg-[linear-gradient(135deg,#fffbf2_0%,#fff5e8_100%)] text-slate-800 shadow-sm',
    iconWrap: 'bg-[linear-gradient(180deg,#f2b451_0%,#df9526_100%)] text-white shadow-sm',
    close: 'text-amber-600/70 hover:bg-amber-100 hover:text-amber-800 focus-visible:ring-amber-300',
  },
  error: {
    Icon: AlertCircle,
    role: 'alert',
    live: 'assertive',
    shell: 'border-rose-200/90 bg-[linear-gradient(135deg,#fff7f6_0%,#fff0ee_100%)] text-slate-800 shadow-sm',
    iconWrap: 'bg-[linear-gradient(180deg,#f26d5f_0%,#e45446_100%)] text-white shadow-sm',
    close: 'text-rose-600/70 hover:bg-rose-100 hover:text-rose-800 focus-visible:ring-rose-300',
  },
};

export function Alert({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
  dismissible = true,
}) {
  const variant = variants[type] || variants.info;
  const Icon = variant.Icon;

  return (
    <div
      role={variant.role}
      aria-live={variant.live}
      aria-atomic="true"
      className={`alert-soft-enter relative flex items-start gap-4 overflow-hidden rounded-[14px] border px-4 py-4 sm:px-5 sm:py-4 ${variant.shell} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_34%)]" />
      <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${variant.iconWrap}`}>
        <Icon size={20} strokeWidth={2.2} />
      </div>

      <div className="relative min-w-0 flex-1 pr-1">
        {title ? <p className="text-[15px] font-semibold leading-6 text-slate-900">{title}</p> : null}
        {message ? <p className="mt-0.5 text-sm font-medium leading-6 text-slate-600">{message}</p> : null}
      </div>

      {dismissible ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className={`relative inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 ${variant.close}`}
        >
          <X size={17} strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}

export function AlertShowcase() {
  return (
    <div className="grid gap-4">
      <Alert type="info" title="System update" message="New analytics data is ready to review." />
      <Alert type="success" title="Changes saved" message="Your course settings were updated successfully." />
      <Alert type="warning" title="Storage almost full" message="You are nearing the upload limit for this workspace." />
      <Alert type="error" title="Action failed" message="We couldn't publish the course. Please try again." />
    </div>
  );
}

export default Alert;
