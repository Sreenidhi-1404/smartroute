import React from 'react';

interface BadgeProps {
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'outline';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className = '',
}) => {
  const styles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    neutral: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    outline: 'bg-transparent text-slate-700 border-slate-300',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const s = status.toLowerCase();
  if (['active', 'completed', 'boarded', 'good', 'resolved'].includes(s)) {
    return <Badge variant="success">{status}</Badge>;
  }
  if (['delayed', 'under review', 'in progress', 'service due', 'pending'].includes(s)) {
    return <Badge variant="warning">{status}</Badge>;
  }
  if (['absent', 'cancelled', 'rejected', 'out of service', 'in workshop', 'suspended'].includes(s)) {
    return <Badge variant="danger">{status}</Badge>;
  }
  if (['started', 'scheduled'].includes(s)) {
    return <Badge variant="info">{status}</Badge>;
  }
  return <Badge variant="default">{status}</Badge>;
};
