import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileQuestion,
  FileText,
  Gauge,
  Home,
  Layers3,
  LibraryBig,
  Menu,
  Network,
  Plus,
  Settings2,
  Sparkles,
  Target,
  UploadCloud,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';

export const navItems = [
  { href: '/', key: 'overview' as const, icon: Home },
  { href: '/lessons', key: 'lessons' as const, icon: BookOpen },
  { href: '/assessments', key: 'assessments' as const, icon: FileQuestion },
  { href: '/homework', key: 'homework' as const, icon: FileText },
  { href: '/upload', key: 'uploadCenter' as const, icon: UploadCloud },
  { href: '/activity', key: 'activity' as const, icon: Activity },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, language, setLanguage } = useI18n();
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className={cn(
        'fixed inset-y-0 z-30 flex w-[248px] flex-col border-sidebar-border bg-sidebar text-sidebar-foreground transition-transform duration-300',
        language === 'ar' ? 'right-0 border-l' : 'left-0 border-r',
        language === 'ar'
          ? (mobileOpen ? 'translate-x-0 md:translate-x-0' : 'translate-x-full md:translate-x-0')
          : (mobileOpen ? 'translate-x-0 md:translate-x-0' : '-translate-x-full md:translate-x-0'),
      )}>
        <div className="flex h-[82px] items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/" data-testid="link-brand" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary font-mono text-sm font-bold text-sidebar-primary-foreground">A</span>
            <span>
              <span className="block font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-sidebar-primary">ALKIFAH</span>
              <span className="block text-[11px] text-sidebar-foreground/60">{t('controlRoom')}</span>
            </span>
          </Link>
          <button type="button" className="rounded-md p-1 text-sidebar-foreground/60 md:hidden" onClick={() => setMobileOpen(false)} data-testid="button-close-menu"><X size={18} /></button>
        </div>
        <div className="px-4 py-6">
          <p className="mb-3 px-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/40">{t('workspace')}</p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
              return <Link key={item.href} href={item.href} data-testid={`link-nav-${item.key}`} className={cn('group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground')}><Icon size={17} strokeWidth={active ? 2.2 : 1.7} /><span>{t(item.key)}</span>{active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}</Link>;
            })}
          </nav>
        </div>
        <div className="mt-auto space-y-4 border-t border-sidebar-border p-4">
          <Link href="/settings" data-testid="link-nav-settings" className={cn('flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors', location.startsWith('/settings') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground')}><Settings2 size={17} /><span>{t('settings')}</span></Link>
          <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex items-center gap-2 text-[11px] font-medium text-sidebar-foreground/70"><span className="h-2 w-2 rounded-full bg-sidebar-primary" /> {t('localWorkspace')}</div>
            <p className="mt-2 text-[11px] leading-relaxed text-sidebar-foreground/45">{language === 'ar' ? 'تبقى ملفاتك قريبة ومنظمة حتى عندما تكون الخدمات هادئة.' : 'Your working set stays close, even when providers are quiet.'}</p>
          </div>
        </div>
      </aside>
      <div className={language === 'ar' ? 'md:pr-[248px]' : 'md:pl-[248px]'}>
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-border/80 bg-background/90 px-4 backdrop-blur-md sm:px-8">
          <button type="button" className="rounded-lg border border-border bg-card p-2 md:hidden" onClick={() => setMobileOpen(true)} data-testid="button-open-menu"><Menu size={18} /></button>
          <div className="hidden items-center gap-2 text-xs text-muted-foreground md:flex"><span className="font-mono text-[10px] uppercase tracking-[0.15em]">{t('teachingOperations')}</span><ChevronRight size={13} /><span className="text-foreground/70">2026 / 27</span></div>
          <div className="ml-auto flex items-center gap-3">
            <button type="button" onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold text-muted-foreground hover:border-primary/50" data-testid="button-language-switch">{t('language')}</button>
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> {t('autosaved')}</div>
            <div className="grid h-8 w-8 place-items-center rounded-full bg-accent font-mono text-xs font-bold text-accent-foreground">ME</div>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-4 py-7 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end"><div><p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p><h1 className="font-sans text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-[38px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}</div>{action}</div>;
}

export function Button({ children, variant = 'primary', className, ...props }: { children: ReactNode; variant?: 'primary' | 'quiet' | 'outline' | 'danger'; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={cn('inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45', variant === 'primary' && 'bg-primary text-primary-foreground shadow-sm hover:opacity-90', variant === 'quiet' && 'bg-muted/70 text-foreground hover:bg-muted', variant === 'outline' && 'border border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/40', variant === 'danger' && 'border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15', className)}>{children}</button>;
}

export function Panel({ children, className, ...props }: { children: ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  return <section {...props} className={cn('rounded-xl border border-card-border bg-card shadow-[0_10px_30px_-24px_hsl(202_31%_18%/.35)]', className)}>{children}</section>;
}

export function StatusPill({ status }: { status: string }) {
  const { t } = useI18n();
  const normalized = status.toLowerCase();
  const translated = normalized === 'ready' ? t('ready') : normalized === 'archived' ? t('archived') : normalized === 'available' ? t('available') : normalized === 'offline' ? t('offline') : normalized === 'pass' ? t('pass') : normalized === 'blocked' ? t('blocked') : status;
  return <span data-testid={`status-${normalized}`} className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em]', normalized === 'ready' || normalized === 'pass' || normalized === 'available' ? 'bg-primary/10 text-primary' : normalized === 'archived' || normalized === 'blocked' ? 'bg-muted text-muted-foreground' : 'bg-accent/20 text-foreground')}><span className={cn('h-1.5 w-1.5 rounded-full', normalized === 'ready' || normalized === 'pass' || normalized === 'available' ? 'bg-primary' : normalized === 'blocked' ? 'bg-muted-foreground' : 'bg-accent')} />{translated}</span>;
}

export function LoadingState({ label = 'Loading workspace' }: { label?: string }) {
  return <div className="space-y-4" data-testid="state-loading">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl border border-border bg-muted/50" />)}<p className="sr-only">{label}</p></div>;
}

export function ErrorState({ onRetry, label = 'Could not load this workspace' }: { onRetry?: () => void; label?: string }) {
  const { t } = useI18n();
  return <div className="grid min-h-[320px] place-items-center rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center" data-testid="state-error"><div><CircleAlert className="mx-auto mb-3 text-destructive" size={25} /><h2 className="font-semibold">{label}</h2><p className="mt-1 text-sm text-muted-foreground">{t('checkLocalService')}</p>{onRetry && <Button variant="outline" className="mt-5" onClick={onRetry} data-testid="button-retry"><Activity size={15} /> {t('retry')}</Button>}</div></div>;
}

export function EmptyState({ icon: Icon = Layers3, title, description, action }: { icon?: typeof Layers3; title: string; description: string; action?: ReactNode }) {
  return <div className="grid min-h-[260px] place-items-center rounded-xl border border-dashed border-border bg-card/50 p-8 text-center" data-testid="state-empty"><div><span className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-secondary text-primary"><Icon size={20} /></span><h2 className="font-semibold">{title}</h2><p className="mx-auto mt-1 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>{action && <div className="mt-5">{action}</div>}</div></div>;
}

export function MetricCard({ label, value, detail, icon: Icon, tone = 'default' }: { label: string; value: ReactNode; detail: string; icon: typeof Gauge; tone?: 'default' | 'mint' | 'amber' }) {
  return <Panel className={cn('relative overflow-hidden p-5', tone === 'mint' && 'bg-secondary/45', tone === 'amber' && 'bg-accent/10')}><div className="flex items-start justify-between"><span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</span><span className="rounded-lg bg-background/70 p-2 text-primary"><Icon size={16} /></span></div><div className="mt-7 flex items-end justify-between"><strong className="font-mono text-3xl tracking-[-0.08em]">{value}</strong><span className="text-right text-[11px] leading-tight text-muted-foreground">{detail}</span></div></Panel>;
}

export function DataRow({ children, href, testId }: { children: ReactNode; href: string; testId: string }) {
  return <Link href={href} data-testid={testId} className="group flex flex-col gap-3 border-b border-border/70 px-4 py-4 transition-colors last:border-b-0 hover:bg-muted/35 sm:flex-row sm:items-center sm:justify-between">{children}<ArrowUpRight size={15} className="shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" /></Link>;
}

export function TimeLabel({ value }: { value: string }) {
  const date = new Date(value);
  return <span className="font-mono text-[10px] text-muted-foreground">{Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>;
}

export function SectionTitle({ children, href, linkLabel = 'View all' }: { children: ReactNode; href?: string; linkLabel?: string }) {
  return <div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-semibold tracking-[-0.01em]">{children}</h2>{href && <Link href={href} data-testid={`link-${linkLabel.toLowerCase().replaceAll(' ', '-')}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">{linkLabel}<ChevronRight size={14} /></Link>}</div>;
}

export const IconBook = BookOpen;
export const IconNetwork = Network;
export const IconSparkles = Sparkles;
export const IconPlus = Plus;
export const IconTarget = Target;
export const IconClock = Clock3;
export const IconLibrary = LibraryBig;
export const IconCheck = Check;