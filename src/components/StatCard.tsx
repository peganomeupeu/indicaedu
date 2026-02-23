import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  highlight?: boolean;
}

export function StatCard({ title, value, subtitle, icon: Icon, highlight }: StatCardProps) {
  return (
    <div className={`
      rounded-xl p-5 shadow-card transition-all duration-200 hover:shadow-elevated
      ${highlight ? 'gradient-primary text-primary-foreground' : 'bg-card text-card-foreground border border-border'}
    `}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className={`mt-1 text-sm ${highlight ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`
          flex items-center justify-center w-10 h-10 rounded-lg
          ${highlight ? 'bg-primary-foreground/20' : 'bg-accent'}
        `}>
          <Icon className={`w-5 h-5 ${highlight ? 'text-primary-foreground' : 'text-primary'}`} />
        </div>
      </div>
    </div>
  );
}
