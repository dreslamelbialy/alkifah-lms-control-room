import { type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  getGetAssessmentQueryKey,
  getGetDashboardQueryKey,
  getGetHomeworkQueryKey,
  getGetLessonQueryKey,
  getHealthCheckQueryKey,
  getListActivityQueryKey,
  getListAssessmentsQueryKey,
  getListHomeworkQueryKey,
  getListLessonsQueryKey,
  getListProvidersQueryKey,
  useAddLessonMaterial,
  useCreateLesson,
  useDeleteLesson,
  useGenerateAssessment,
  useGenerateHomework,
  useGetAssessment,
  useGetDashboard,
  useGetHomework,
  useGetLesson,
  useHealthCheck,
  useListActivity,
  useListAssessments,
  useListHomework,
  useListLessons,
  useListProviders,
  usePrepareWorkflow,
  useUpdateLesson,
  useUpdateProviderSettings,
} from '@workspace/api-client-react';
import {
  Activity,
  BookOpen,
  Check,
  ChevronLeft,
  CircleAlert,
  Clock3,
  FileQuestion,
  FileText,
  Filter,
  Gauge,
  Layers3,
  Link2,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  FolderOpen,
  ExternalLink,
  HardDrive,
  FileCheck2,
  Cloud,
  WandSparkles,
  X,
} from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { AppShell, Button, DataRow, EmptyState, ErrorState, IconBook, IconCheck, IconClock, IconLibrary, IconNetwork, IconPlus, IconSparkles, LoadingState, MetricCard, PageHeader, Panel, SectionTitle, StatusPill, TimeLabel } from '@/components/lms-ui';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { I18nProvider, useI18n } from '@/lib/i18n';

const queryClient = new QueryClient();

function QueryState({ loading, error, retry, children }: { loading?: boolean; error?: boolean; retry?: () => void; children: ReactNode }) {
  if (loading) return <LoadingState />;
  if (error) return <ErrorState onRetry={retry} />;
  return <>{children}</>;
}

function DashboardContent() {
  const { t } = useI18n();
  const dashboard = useGetDashboard({ query: { queryKey: getGetDashboardQueryKey() } });
  const lessons = useListLessons();
  const providers = useListProviders();
  const data = dashboard.data;
  const recentLessons = (lessons.data ?? []).slice(0, 4);
  return <QueryState loading={dashboard.isLoading} error={dashboard.isError} retry={() => dashboard.refetch()}><div className="space-y-8">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
       <MetricCard label={t('lessonsInWorkspace')} value={data?.lessonCount ?? 0} detail={`${data?.readyLessonCount ?? 0} ${t('readyToRun')}`} icon={IconBook} tone="mint" />
       <MetricCard label={t('easyAssessments')} value={data?.assessmentCount ?? 0} detail={t('reviewQueue')} icon={FileQuestion} />
       <MetricCard label={t('homeworkSheets')} value={data?.homeworkCount ?? 0} detail={t('generatedLocally')} icon={FileText} tone="amber" />
       <MetricCard label={t('providersOnline')} value={data?.providerCount ?? providers.data?.filter((p) => p.available).length ?? 0} detail={t('availableNow')} icon={IconNetwork} />
    </div>
    <div className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
       <Panel><div className="border-b border-border px-5 py-4"><SectionTitle href="/lessons">{t('lessonPulse')}</SectionTitle><p className="text-xs text-muted-foreground">{t('recentSource')}</p></div><QueryState loading={lessons.isLoading} error={lessons.isError} retry={() => lessons.refetch()}>{recentLessons.length ? <div>{recentLessons.map((lesson) => <DataRow key={lesson.id} href={`/lessons/${lesson.id}`} testId={`row-dashboard-lesson-${lesson.id}`}><div className="flex min-w-0 items-center gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><BookOpen size={16} /></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{lesson.title}</p><p className="mt-0.5 text-xs text-muted-foreground">{lesson.course}{lesson.level ? ` · ${lesson.level}` : ''}</p></div></div><div className="flex items-center gap-4 sm:ml-auto"><StatusPill status={lesson.status} /><span className="font-mono text-[10px] text-muted-foreground">{lesson.materialCount} {t('lessonMaterialsCount')}</span></div></DataRow>)}</div> : <EmptyState icon={BookOpen} title={t('firstLesson')} description={t('firstLessonDescription')} action={<Link href="/lessons" data-testid="link-dashboard-create-lesson"><Button><Plus size={15} /> {t('addLesson')}</Button></Link>} />}</QueryState></Panel>
       <Panel className="p-5"><SectionTitle href="/activity">{t('recentActivity')}</SectionTitle><div className="mt-5 space-y-4">{(data?.recentActivity ?? []).slice(0, 5).map((item) => <div key={item.id} className="flex gap-3" data-testid={`activity-dashboard-${item.id}`}><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0"><p className="text-sm font-medium">{item.label}</p><p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{item.detail || item.action}</p><TimeLabel value={item.createdAt} /></div></div>)}{!data?.recentActivity?.length && <p className="py-8 text-sm text-muted-foreground">{t('actionsAppear')}</p>}</div></Panel>
    </div>
     <Panel className="overflow-hidden"><div className="flex flex-col gap-3 border-b border-border bg-secondary/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><SectionTitle>{t('readinessLane')}</SectionTitle><p className="text-xs text-muted-foreground">{t('readinessDescription')}</p></div><Link href="/settings" data-testid="link-dashboard-provider-settings"><Button variant="outline"><Settings2 size={15} /> {t('providerSettings')}</Button></Link></div><div className="grid gap-px bg-border sm:grid-cols-3"><div className="bg-card p-5"><p className="text-xs text-muted-foreground">{t('readyLessons')}</p><p className="mt-2 font-mono text-2xl">{data?.readyLessonCount ?? 0}<span className="ml-2 text-xs text-muted-foreground">of {data?.lessonCount ?? 0}</span></p></div><div className="bg-card p-5"><p className="text-xs text-muted-foreground">{t('availableProviders')}</p><p className="mt-2 font-mono text-2xl">{providers.data?.filter((p) => p.available).length ?? data?.providerCount ?? 0}</p></div><div className="bg-card p-5"><p className="text-xs text-muted-foreground">{t('lastLocalSync')}</p><p className="mt-2 font-mono text-sm">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div></Panel>
  </div></QueryState>;
}

function DashboardPage() {
  const { t } = useI18n();
  const health = useHealthCheck({ query: { queryKey: getHealthCheckQueryKey() } });
  return <><PageHeader eyebrow={t('overviewEyebrow')} title={t('goodMorning')} description={t('overviewDescription')} action={<div className="flex items-center gap-2 text-xs text-muted-foreground"><span className={cn('h-2 w-2 rounded-full', health.data?.status === 'ok' ? 'bg-primary' : health.isLoading ? 'bg-accent' : 'bg-destructive')} /> {health.data?.status === 'ok' ? t('workspaceHealthy') : health.isLoading ? t('checkingService') : t('serviceAttention')}</div>} /><DashboardContent /></>;
}

type UploadFile = { id: string; file: File; selected: boolean };

function UploadCenterPage() {
  const { t, language } = useI18n();
  const lessons = useListLessons();
  const addMaterial = useAddLessonMaterial();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [path, setPath] = useState('');
  const [lessonId, setLessonId] = useState('');
  const [kind, setKind] = useState<'material' | 'booklet'>('material');
  const [driveLink, setDriveLink] = useState('');
  const [driveLinks, setDriveLinks] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const next = Array.from(incoming).map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}`,
      file,
      selected: true,
    }));
    setFiles((current) => {
      const seen = new Set(current.map((item) => item.id));
      return [...current, ...next.filter((item) => !seen.has(item.id))];
    });
    setMessage('');
  };

  const selectedFiles = files.filter((item) => item.selected);
  const saveSelected = async () => {
    setError('');
    setMessage('');
    if (!lessonId) { setError(t('chooseLesson')); return; }
    if (!selectedFiles.length) { setError(t('chooseAtLeastOne')); return; }
    try {
      for (const item of selectedFiles) {
        const extension = item.file.name.split('.').pop()?.toLowerCase();
        const isText = ['txt', 'md', 'csv', 'json', 'html'].includes(extension ?? '');
        const content = isText && item.file.size <= 250_000
          ? await item.file.text()
          : `${kind === 'booklet' ? 'Booklet' : 'Lesson material'} selected from laptop: ${item.file.name}\nSize: ${Math.round(item.file.size / 1024)} KB\nSource path: ${path || 'browser file picker'}`;
        await addMaterial.mutateAsync({
          id: Number(lessonId),
          data: { name: item.file.name, kind: 'document', content },
        });
      }
      setMessage(`${selectedFiles.length} ${t('added')}`);
      setFiles((current) => current.filter((item) => !item.selected));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save the selected files.');
    }
  };

  const openLms = (target: 'login' | 'materials') => {
    window.open(`https://lms.alkifah.edu.sa${target === 'login' ? '/Identity/Account/LogIn' : '/CourseManagement/Materials/Create'}`, '_blank', 'noopener,noreferrer');
  };

  return <><PageHeader eyebrow={t('uploadEyebrow')} title={t('uploadTitle')} description={t('uploadDescription')} action={<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => openLms('login')}><ExternalLink size={15} /> {t('openLogin')}</Button><Button onClick={() => openLms('materials')}><UploadCloud size={15} /> {t('openMaterials')}</Button></div>} />
    <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
      <div className="space-y-6">
        <Panel className="p-5">
          <div className="flex items-start justify-between gap-4"><div><SectionTitle><span className="flex items-center gap-2"><HardDrive size={17} className="text-primary" /> {language === 'ar' ? 'مصدر الملفات' : 'Laptop file source'}</span></SectionTitle><p className="text-xs text-muted-foreground">{t('pathHint')}</p></div><span className="rounded-full bg-secondary px-2.5 py-1 font-mono text-[10px] text-primary">{selectedFiles.length} {t('selected')}</span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="block"><span className="mb-1.5 block text-xs font-semibold">{t('laptopPath')}</span><input value={path} onChange={(event) => setPath(event.target.value)} className="field" placeholder={language === 'ar' ? 'مثال: D:\\\\Alkifah academy\\\\First Term' : 'e.g. D:\\\\Alkifah academy\\\\First Term'} data-testid="input-laptop-path" /></label><div className="flex items-end gap-2"><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-semibold hover:border-primary/50"><FolderOpen size={15} /> {t('chooseFiles')}<input type="file" multiple className="hidden" onChange={(event) => addFiles(event.target.files)} data-testid="input-upload-files" /></label><label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm font-semibold hover:border-primary/50"><HardDrive size={15} /> {t('chooseFolder')}<input type="file" multiple className="hidden" onChange={(event) => addFiles(event.target.files)} {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)} data-testid="input-upload-folder" /></label></div></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold">{t('lesson')}</span><select value={lessonId} onChange={(event) => setLessonId(event.target.value)} className="field" data-testid="select-upload-lesson"><option value="">{t('lesson')}</option>{lessons.data?.filter((lesson) => lesson.status !== 'archived').map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title} · {lesson.course}</option>)}</select></label><label className="block"><span className="mb-1.5 block text-xs font-semibold">{t('materialType')}</span><select value={kind} onChange={(event) => setKind(event.target.value as 'material' | 'booklet')} className="field" data-testid="select-upload-kind"><option value="material">{t('materials')}</option><option value="booklet">{t('booklets')}</option></select></label></div>
        </Panel>
        <Panel className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4"><div><SectionTitle><span className="flex items-center gap-2"><FileCheck2 size={17} className="text-primary" /> {language === 'ar' ? 'قائمة الملفات' : 'File queue'}</span></SectionTitle><p className="text-xs text-muted-foreground">{files.length ? `${files.length} ${language === 'ar' ? 'ملفات في القائمة' : 'files in queue'}` : t('noFilesDescription')}</p></div><div className="flex gap-2"><Button variant="quiet" onClick={() => setFiles((current) => current.map((item) => ({ ...item, selected: true })))}>{t('selectAll')}</Button><Button variant="outline" onClick={() => setFiles([])}>{t('clear')}</Button></div></div>{files.length ? <div>{files.map((item) => <label key={item.id} className="flex items-center gap-3 border-b border-border/70 px-5 py-3 last:border-b-0"><input type="checkbox" checked={item.selected} onChange={(event) => setFiles((current) => current.map((candidate) => candidate.id === item.id ? { ...candidate, selected: event.target.checked } : candidate))} className="h-4 w-4 accent-[hsl(var(--primary))]" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{item.file.name}</span><span className="font-mono text-[10px] text-muted-foreground">{Math.max(1, Math.round(item.file.size / 1024))} KB</span><button type="button" onClick={() => setFiles((current) => current.filter((candidate) => candidate.id !== item.id))} className="text-xs text-muted-foreground hover:text-destructive">{t('remove')}</button></label>)}</div> : <EmptyState icon={FolderOpen} title={t('noFiles')} description={t('noFilesDescription')} />}<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/20 px-5 py-4">{(message || error) && <p className={cn('text-xs font-semibold', error ? 'text-destructive' : 'text-primary')}>{error || message}</p>}<Button className="ml-auto" onClick={saveSelected} disabled={addMaterial.isPending || !files.length}><UploadCloud size={15} /> {addMaterial.isPending ? (language === 'ar' ? 'جار الحفظ…' : 'Saving…') : t('uploadSelected')}</Button></div></Panel>
      </div>
      <div className="space-y-6">
        <Panel className="p-5"><div className="flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary"><Cloud size={18} /></span><div><SectionTitle>{t('driveTitle')}</SectionTitle><p className="text-xs leading-relaxed text-muted-foreground">{t('driveDescription')}</p></div></div><div className="mt-5 flex gap-2"><input value={driveLink} onChange={(event) => setDriveLink(event.target.value)} className="field" placeholder="https://drive.google.com/..." data-testid="input-drive-link" /><Button variant="outline" onClick={() => { if (driveLink.trim()) { setDriveLinks((current) => [...current, driveLink.trim()]); setDriveLink(''); } }}>{t('addDrive')}</Button></div>{driveLinks.length > 0 && <div className="mt-4 space-y-2">{driveLinks.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="block truncate rounded-lg bg-secondary/50 px-3 py-2 text-xs text-primary hover:underline">{link}</a>)}</div>}<div className="mt-5 border-t border-border pt-4"><p className="text-xs font-semibold">{t('instructionsTitle')}</p><ol className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground" dir={language === 'ar' ? 'rtl' : 'ltr'}><li>1. {t('step1')}</li><li>2. {t('step2')}</li><li>3. {t('step3')}</li><li>4. {t('step4')}</li></ol></div></Panel>
        <Panel className="border-primary/25 bg-secondary/25 p-5"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={17} className="text-primary" /> {t('safetyTitle')}</div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('safetyDescription')}</p><div className="mt-5 grid gap-2"><Button variant="outline" onClick={() => openLms('login')}><ExternalLink size={15} /> {t('openLogin')}</Button><Button variant="quiet" onClick={() => openLms('materials')}><UploadCloud size={15} /> {t('openMaterials')}</Button></div></Panel>
      </div>
    </div>
  </>;
}

function LessonForm({ onDone, initial }: { onDone: () => void; initial?: { id?: number; title: string; course: string; level?: string | null; status?: string } }) {
  const { t } = useI18n();
  const create = useCreateLesson();
  const update = useUpdateLesson();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [course, setCourse] = useState(initial?.course ?? '');
  const [level, setLevel] = useState(initial?.level ?? '');
  const [status, setStatus] = useState(initial?.status === 'ready' ? 'ready' : 'draft');
  const isEdit = Boolean(initial);
  const submit = () => {
    if (!title.trim() || !course.trim()) return;
    if (isEdit && initial?.id) update.mutate({ id: initial.id, data: { title, course, level: level || null, status: status as 'draft' | 'ready' | 'archived' } }, { onSuccess: onDone });
    else create.mutate({ data: { title, course, level: level || null, status: status as 'draft' | 'ready' } }, { onSuccess: onDone });
  };
  return <div className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-semibold">{t('lessonTitle')}</span><input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} className="field" placeholder={t('lessonTitlePlaceholder')} data-testid="input-lesson-title" /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1.5 block text-xs font-semibold">{t('course')}</span><input value={course} onChange={(e) => setCourse(e.target.value)} className="field" placeholder={t('coursePlaceholder')} data-testid="input-lesson-course" /></label><label className="block"><span className="mb-1.5 block text-xs font-semibold">{t('level')}</span><input value={level} onChange={(e) => setLevel(e.target.value)} className="field" placeholder={t('levelPlaceholder')} data-testid="input-lesson-level" /></label></div><label className="block"><span className="mb-1.5 block text-xs font-semibold">{t('workflowStatus')}</span><select value={status} onChange={(e) => setStatus(e.target.value)} className="field" data-testid="select-lesson-status"><option value="draft">{t('draft')}</option><option value="ready">{t('ready')}</option>{isEdit && <option value="archived">{t('archived')}</option>}</select></label><div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={onDone} data-testid="button-cancel-lesson">{t('cancel')}</Button><Button onClick={submit} disabled={!title.trim() || !course.trim() || create.isPending || update.isPending} data-testid="button-save-lesson">{(create.isPending || update.isPending) && <LoaderCircle size={15} className="animate-spin" />} {isEdit ? t('saveChanges') : t('createLesson')}</Button></div></div>;
}

function LessonsPage() {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [status, setStatus] = useState('all');
  const queryClient = useQueryClient();
  const lessons = useListLessons({ ...(search ? { search } : {}), ...(status !== 'all' ? { status: status as 'draft' | 'ready' | 'archived' } : {}) });
  const deleteLesson = useDeleteLesson();
  const filtered = lessons.data ?? [];
  return <><PageHeader eyebrow={t('librarySource')} title={t('lessonsTitle')} description={t('lessonsDescription')} action={<Button onClick={() => setShowForm(true)} data-testid="button-new-lesson"><Plus size={16} /> {t('newLesson')}</Button>} />{showForm && <Panel className="mb-6 border-primary/30 bg-secondary/20 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">{t('startLesson')}</h2><p className="text-xs text-muted-foreground">{t('specificTitle')}</p></div><button type="button" onClick={() => setShowForm(false)} data-testid="button-close-lesson-form"><X size={17} /></button></div><LessonForm onDone={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey() }); }} /></Panel>}<div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} className="field pl-9" placeholder={t('searchLessons')} data-testid="input-search-lessons" /></div><Button variant="outline" onClick={() => setShowFilter((v) => !v)} data-testid="button-filter-lessons"><Filter size={15} /> {t('filter')}</Button>{showFilter && <select value={status} onChange={(e) => setStatus(e.target.value)} className="field sm:w-36" data-testid="select-filter-lessons"><option value="all">{t('allStatus')}</option><option value="draft">{t('draft')}</option><option value="ready">{t('ready')}</option><option value="archived">{t('archived')}</option></select>}</div><QueryState loading={lessons.isLoading} error={lessons.isError} retry={() => lessons.refetch()}>{filtered.length ? <Panel className="overflow-hidden"><div className="hidden grid-cols-[1.4fr_1fr_120px_100px_90px] gap-4 border-b border-border bg-muted/35 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:grid"><span>{t('lessonsTitle')}</span><span>{t('course')}</span><span>{t('workflowStatus')}</span><span>{t('materials')}</span><span>{t('updated')}</span></div>{filtered.map((lesson) => <div key={lesson.id} className="group flex flex-col gap-3 border-b border-border/70 px-5 py-4 last:border-b-0 hover:bg-muted/20 sm:grid sm:grid-cols-[1.4fr_1fr_120px_100px_90px] sm:items-center sm:gap-4"><Link href={`/lessons/${lesson.id}`} data-testid={`link-lesson-${lesson.id}`} className="min-w-0"><p className="truncate text-sm font-semibold group-hover:text-primary">{lesson.title}</p><p className="mt-1 text-xs text-muted-foreground sm:hidden">{lesson.course}{lesson.level ? ` · ${lesson.level}` : ''}</p></Link><span className="hidden text-sm text-muted-foreground sm:block">{lesson.course}</span><StatusPill status={lesson.status} /><span className="text-xs text-muted-foreground">{lesson.materialCount} {t('lessonMaterialsCount')}</span><div className="flex items-center justify-between sm:justify-end sm:gap-3"><TimeLabel value={lesson.updatedAt} /><button type="button" onClick={() => { if (window.confirm(t('archiveLesson'))) deleteLesson.mutate({ id: lesson.id }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey() }) }); }} className="text-muted-foreground hover:text-destructive" data-testid={`button-delete-lesson-${lesson.id}`}><Trash2 size={15} /></button></div></div>)}</Panel> : <EmptyState icon={BookOpen} title={search ? t('noLessonsMatch') : t('noLessonsYet')} description={search ? t('broaderSearch') : t('firstLessonDescription2')} action={!search && <Button onClick={() => setShowForm(true)}><Plus size={15} /> {t('addLesson')}</Button>} />}</QueryState></>;
}

function MaterialForm({ lessonId, onDone }: { lessonId: number; onDone: () => void }) {
  const { t } = useI18n();
  const addMaterial = useAddLessonMaterial();
  const [name, setName] = useState('');
  const [kind, setKind] = useState('text');
  const [content, setContent] = useState('');
  return <div className="grid gap-3"><input value={name} onChange={(e) => setName(e.target.value)} className="field" placeholder={t('materialName')} data-testid="input-material-name" /><select value={kind} onChange={(e) => setKind(e.target.value)} className="field" data-testid="select-material-kind"><option value="text">{t('textNotes')}</option><option value="document">{t('document')}</option><option value="link">{t('link')}</option></select><textarea value={content} onChange={(e) => setContent(e.target.value)} className="field min-h-28 resize-y" placeholder={t('pasteContent')} data-testid="textarea-material-content" /><div className="flex justify-end"><Button disabled={!name.trim() || !content.trim() || addMaterial.isPending} onClick={() => addMaterial.mutate({ id: lessonId, data: { name, kind: kind as 'text' | 'document' | 'link', content } }, { onSuccess: onDone })} data-testid="button-save-material">{addMaterial.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <Plus size={15} />} {t('addMaterial')}</Button></div></div>;
}

function LessonDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const lesson = useGetLesson(id, { query: { queryKey: getGetLessonQueryKey(id) } });
  const generateAssessment = useGenerateAssessment();
  const generateHomework = useGenerateHomework();
  const prepareWorkflow = usePrepareWorkflow();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [result, setResult] = useState<{ ready: boolean; checks: { id: string; label: string; status: string; detail: string }[] } | null>(null);
  const item = lesson.data;
  if (!item && lesson.isLoading) return <LoadingState />;
  if (lesson.isError || !item) return <ErrorState onRetry={() => lesson.refetch()} label={t('lessonNotFound')} />;
  const onGenerateAssessment = () => generateAssessment.mutate({ data: { lessonId: id, questionCount: 5 } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListAssessmentsQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetLessonQueryKey(id) }); } });
  const onGenerateHomework = () => generateHomework.mutate({ data: { lessonId: id } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListHomeworkQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetLessonQueryKey(id) }); } });
  return <><div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"><Link href="/lessons" className="inline-flex items-center gap-1 hover:text-foreground" data-testid="link-back-lessons"><ChevronLeft size={14} /> {t('backToLessons')}</Link><span>/</span><span className="truncate">{item.title}</span></div><PageHeader eyebrow={`${item.course} / ${t('lessonWorkspace')}`} title={item.title} description={`${item.materialCount} ${t('lessonMaterialsCount')} · ${item.assessmentCount ?? 0} ${t('assessmentsTitle').toLowerCase()}`} action={<div className="flex items-center gap-2"><StatusPill status={item.status} /><Button variant="outline" onClick={() => setEditing((v) => !v)} data-testid="button-edit-lesson"><Pencil size={14} /> {t('edit')}</Button></div>} />{editing && <Panel className="mb-6 border-primary/30 bg-secondary/20 p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">{t('editLessonDetails')}</h2><p className="text-xs text-muted-foreground">{t('statusAligned')}</p></div><button type="button" onClick={() => setEditing(false)} data-testid="button-close-edit-lesson"><X size={17} /></button></div><LessonForm initial={item} onDone={() => { setEditing(false); queryClient.invalidateQueries({ queryKey: getGetLessonQueryKey(id) }); queryClient.invalidateQueries({ queryKey: getListLessonsQueryKey() }); }} /></Panel>}<div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]"><div className="space-y-6"><Panel><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><SectionTitle>{t('sourceMaterials')}</SectionTitle><p className="text-xs text-muted-foreground">{t('sourceMaterialsDescription')}</p></div><Button variant="outline" onClick={() => setAdding((v) => !v)} data-testid="button-add-material"><Plus size={15} /> {t('addMaterial')}</Button></div>{adding && <div className="border-b border-border bg-secondary/20 p-5"><MaterialForm lessonId={id} onDone={() => { setAdding(false); queryClient.invalidateQueries({ queryKey: getGetLessonQueryKey(id) }); }} /></div>}{item.materials?.length ? <div>{item.materials.map((material) => <div key={material.id} className="border-b border-border/70 p-5 last:border-b-0" data-testid={`card-material-${material.id}`}><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold">{material.name}</p><p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">{material.kind}</p></div><TimeLabel value={material.createdAt} /></div><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{material.content}</p></div>)}</div> : <EmptyState icon={Layers3} title={t('noSourceMaterial')} description={t('noSourceMaterialDescription')} />}</Panel></div><div className="space-y-6"><Panel className="p-5"><SectionTitle>{t('generateReviewAssets')}</SectionTitle><p className="mb-5 text-xs leading-relaxed text-muted-foreground">{t('generationExplicit')}</p><div className="space-y-3"><Button className="w-full justify-between" onClick={onGenerateAssessment} disabled={generateAssessment.isPending} data-testid="button-generate-assessment"><span className="flex items-center gap-2"><FileQuestion size={16} /> {t('easyAssessment')}</span>{generateAssessment.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <span className="font-mono text-[10px]">{t('fiveQuestions')}</span>}</Button><Button variant="outline" className="w-full justify-between" onClick={onGenerateHomework} disabled={generateHomework.isPending} data-testid="button-generate-homework"><span className="flex items-center gap-2"><FileText size={16} /> {t('homeworkSheet')}</span>{generateHomework.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <span className="font-mono text-[10px]">{t('draft')}</span>}</Button></div>{(generateAssessment.isError || generateHomework.isError) && <p className="mt-3 text-xs text-destructive">{t('generationFailed')}</p>}</Panel><Panel className="p-5"><div className="flex items-start justify-between"><div><SectionTitle>{t('workflowReadiness')}</SectionTitle><p className="text-xs leading-relaxed text-muted-foreground">{t('checklistDescription')}</p></div><ShieldCheck size={19} className="text-primary" /></div><Button variant="quiet" className="mt-5 w-full" onClick={() => prepareWorkflow.mutate({ data: { lessonId: id } }, { onSuccess: setResult })} disabled={prepareWorkflow.isPending} data-testid="button-prepare-workflow">{prepareWorkflow.isPending ? <LoaderCircle size={15} className="animate-spin" /> : <ShieldCheck size={15} />} {t('prepareChecklist')}</Button>{result && <div className="mt-5 space-y-3 border-t border-border pt-4" data-testid="workflow-result"><div className="flex items-center gap-2">{result.ready ? <Check className="text-primary" size={16} /> : <CircleAlert className="text-accent" size={16} />}<span className="text-sm font-semibold">{result.ready ? t('readyForLms') : t('needsAttention')}</span></div>{result.checks.map((check) => <div key={check.id} className="rounded-lg bg-muted/45 p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{check.label}</span><StatusPill status={check.status} /></div><p className="mt-1 text-xs text-muted-foreground">{check.detail}</p></div>)}</div>}</Panel></div></div></>;
}

function AssessmentsPage() {
  const { t } = useI18n();
  const assessments = useListAssessments();
  return <><PageHeader eyebrow={t('assessmentsEyebrow')} title={t('assessmentsTitle')} description={t('assessmentsDescription')} action={<Link href="/lessons" data-testid="link-assessments-to-lessons"><Button><WandSparkles size={15} /> {t('generateFromLesson')}</Button></Link>} /><QueryState loading={assessments.isLoading} error={assessments.isError} retry={() => assessments.refetch()}>{assessments.data?.length ? <div className="grid gap-4 lg:grid-cols-2">{assessments.data.map((assessment) => <Link key={assessment.id} href={`/assessments/${assessment.id}`} data-testid={`card-assessment-${assessment.id}`} className="group"><Panel className="h-full p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-primary/45"><div className="flex items-start justify-between gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary text-primary"><FileQuestion size={17} /></span><StatusPill status={assessment.difficulty} /></div><h2 className="mt-5 font-semibold">{assessment.title}</h2><p className="mt-1 text-xs text-muted-foreground">{assessment.lessonTitle}</p><div className="mt-6 flex items-center justify-between border-t border-border pt-4"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{assessment.questionCount} {t('questions')} · {assessment.provider || t('localProvider')}</span><TimeLabel value={assessment.createdAt} /></div></Panel></Link>)}</div> : <EmptyState icon={FileQuestion} title={t('noAssessments')} description={t('noAssessmentsDescription')} action={<Link href="/lessons" data-testid="link-empty-assessment-lessons"><Button><BookOpen size={15} /> {t('browseLessons')}</Button></Link>} />}</QueryState></>;
}

function AssessmentDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const assessment = useGetAssessment(id, { query: { queryKey: getGetAssessmentQueryKey(id) } });
  const item = assessment.data;
  if (assessment.isLoading) return <LoadingState />;
  if (assessment.isError || !item) return <ErrorState onRetry={() => assessment.refetch()} label={t('assessmentNotFound')} />;
  return <><div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"><Link href="/assessments" className="inline-flex items-center gap-1 hover:text-foreground" data-testid="link-back-assessments"><ChevronLeft size={14} /> {t('assessmentsTitle')}</Link><span>/</span><span>{item.title}</span></div><PageHeader eyebrow={`${item.lessonTitle} / ${t('assessment')}`} title={item.title} description={`${item.questionCount} ${t('questions')} · ${item.provider || t('localProvider')} · ${item.difficulty} ${t('difficulty')}`} action={<StatusPill status={item.difficulty} />} /><div className="grid gap-6 xl:grid-cols-[1fr_320px]"><Panel className="divide-y divide-border">{item.questions?.map((question, index) => <div key={question.id} className="p-5 sm:p-7" data-testid={`card-question-${question.id}`}><div className="mb-4 flex items-center gap-3"><span className="grid h-7 w-7 place-items-center rounded-md bg-secondary font-mono text-xs font-bold text-primary">{String(index + 1).padStart(2, '0')}</span><span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{t('question')}</span></div><h2 className="max-w-2xl text-base font-semibold leading-relaxed">{question.prompt}</h2><div className="mt-4 grid gap-2 sm:grid-cols-2">{question.options.map((option) => <div key={option} className={cn('rounded-lg border px-3 py-2.5 text-sm', option === question.answer ? 'border-primary/35 bg-secondary/45 font-semibold text-primary' : 'border-border text-muted-foreground')}><span className="mr-2 font-mono text-[10px]">{option === question.answer ? '✓' : '—'}</span>{option}</div>)}</div><p className="mt-4 border-l-2 border-accent pl-3 text-xs leading-relaxed text-muted-foreground"><strong className="text-foreground">{t('explanation')}: </strong>{question.explanation}</p></div>)}</Panel><Panel className="h-fit p-5"><SectionTitle>{t('timingReview')}</SectionTitle><div className="mt-5 space-y-4"><div><p className="text-xs text-muted-foreground">{t('opens')}</p><p className="mt-1 flex items-center gap-2 font-mono text-sm"><Clock3 size={14} className="text-primary" />{new Date(item.opensAt).toLocaleString()}</p></div><div><p className="text-xs text-muted-foreground">{t('closes')}</p><p className="mt-1 flex items-center gap-2 font-mono text-sm"><Clock3 size={14} className="text-primary" />{new Date(item.closesAt).toLocaleString()}</p></div><div className="border-t border-border pt-4"><p className="text-xs leading-relaxed text-muted-foreground">{t('lmsPublishingNote')}</p></div></div></Panel></div></>;
}

function HomeworkPage() {
  const { t } = useI18n();
  const homework = useListHomework();
  return <><PageHeader eyebrow={t('homeworkEyebrow')} title={t('homeworkTitle')} description={t('homeworkDescription')} action={<Link href="/lessons" data-testid="link-homework-to-lessons"><Button><WandSparkles size={15} /> {t('generateFromLesson')}</Button></Link>} /><QueryState loading={homework.isLoading} error={homework.isError} retry={() => homework.refetch()}>{homework.data?.length ? <div className="grid gap-4 lg:grid-cols-2">{homework.data.map((item) => <Link key={item.id} href={`/homework/${item.id}`} data-testid={`card-homework-${item.id}`} className="group"><Panel className="h-full p-5 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-accent/60"><div className="flex items-start justify-between"><span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-foreground"><FileText size={17} /></span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{item.provider}</span></div><h2 className="mt-5 font-semibold">{item.title}</h2><p className="mt-1 text-xs text-muted-foreground">{item.lessonTitle}</p><div className="mt-6 flex items-center justify-between border-t border-border pt-4"><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">{item.exerciseCount} {t('exercises')}</span><TimeLabel value={item.createdAt} /></div></Panel></Link>)}</div> : <EmptyState icon={FileText} title={t('noHomework')} description={t('noHomeworkDescription')} action={<Link href="/lessons" data-testid="link-empty-homework-lessons"><Button><BookOpen size={15} /> {t('browseLessons')}</Button></Link>} />}</QueryState></>;
}

function HomeworkDetailPage() {
  const { t } = useI18n();
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const homework = useGetHomework(id, { query: { queryKey: getGetHomeworkQueryKey(id) } });
  const item = homework.data;
  if (homework.isLoading) return <LoadingState />;
  if (homework.isError || !item) return <ErrorState onRetry={() => homework.refetch()} label={t('homeworkNotFound')} />;
  return <><div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground"><Link href="/homework" className="inline-flex items-center gap-1 hover:text-foreground" data-testid="link-back-homework"><ChevronLeft size={14} /> {t('homeworkTitle')}</Link><span>/</span><span>{item.title}</span></div><PageHeader eyebrow={`${item.lessonTitle} / ${t('homeworkLabel')}`} title={item.title} description={`${item.exerciseCount} ${t('exercises')} · ${t('generatedLocally')} ${item.provider}`} action={<Button variant="outline" onClick={() => window.print()} data-testid="button-print-homework"><Send size={15} /> {t('printReview')}</Button>} /><Panel className="divide-y divide-border">{item.exercises?.map((exercise, index) => <div key={exercise.id} className="grid gap-3 p-5 sm:grid-cols-[48px_1fr_220px] sm:items-start sm:p-7" data-testid={`card-exercise-${exercise.id}`}><span className="font-mono text-xs font-bold text-primary">{String(index + 1).padStart(2, '0')}</span><div><p className="text-sm font-semibold leading-relaxed">{exercise.prompt}</p></div><div className="rounded-lg bg-secondary/45 p-3"><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">{t('answerKey')}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{exercise.answer}</p></div></div>)}</Panel></>;
}

function ActivityPage() {
  const { t } = useI18n();
  const activity = useListActivity({ limit: 50 }, { query: { queryKey: getListActivityQueryKey({ limit: 50 }) } });
  return <><PageHeader eyebrow={t('activityEyebrow')} title={t('activityTitle')} description={t('activityDescription')} action={<Button variant="outline" onClick={() => activity.refetch()} data-testid="button-refresh-activity"><RefreshCw size={15} /> {t('refresh')}</Button>} /><QueryState loading={activity.isLoading} error={activity.isError} retry={() => activity.refetch()}>{activity.data?.length ? <Panel>{activity.data.map((item) => <div key={item.id} className="flex gap-4 border-b border-border/70 p-5 last:border-b-0" data-testid={`row-activity-${item.id}`}><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-secondary text-primary"><Activity size={15} /></span><div className="min-w-0 flex-1"><div className="flex flex-col justify-between gap-1 sm:flex-row"><p className="text-sm font-semibold">{item.label}</p><TimeLabel value={item.createdAt} /></div><p className="mt-1 text-sm text-muted-foreground">{item.detail || item.action}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-primary">{item.action}</p></div></div>)}</Panel> : <EmptyState icon={Activity} title={t('noActivity')} description={t('noActivityDescription')} />}</QueryState></>;
}

function SettingsPage() {
  const { t } = useI18n();
  const providers = useListProviders();
  const update = useUpdateProviderSettings();
  const queryClient = useQueryClient();
  const selected = providers.data?.find((provider) => provider.selected);
  const [message, setMessage] = useState('');
  return <><PageHeader eyebrow={t('settingsEyebrow')} title={t('settingsTitle')} description={t('settingsDescription')} /><div className="grid gap-6 lg:grid-cols-[1fr_340px]"><QueryState loading={providers.isLoading} error={providers.isError} retry={() => providers.refetch()}><Panel><div className="border-b border-border px-5 py-4"><SectionTitle>{t('aiProviders')}</SectionTitle><p className="text-xs text-muted-foreground">{t('oneProvider')}</p></div><div>{providers.data?.map((provider) => <div key={provider.id} className={cn('flex flex-col gap-4 border-b border-border/70 p-5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between', provider.selected && 'bg-secondary/25')} data-testid={`row-provider-${provider.id}`}><div className="flex items-center gap-3"><span className={cn('grid h-9 w-9 place-items-center rounded-lg font-mono text-xs font-bold', provider.available ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground')}>{provider.label.slice(0, 2).toUpperCase()}</span><div><p className="text-sm font-semibold">{provider.label}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{provider.model}</p></div></div><div className="flex items-center gap-3"><StatusPill status={provider.available ? 'available' : 'offline'} />{provider.selected ? <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"><Check size={14} /> {t('selected')}</span> : <Button variant="outline" disabled={!provider.available || update.isPending} onClick={() => update.mutate({ data: { provider: provider.id, model: provider.model } }, { onSuccess: () => { setMessage(`${provider.label} ${t('providerSelected')}`); queryClient.invalidateQueries({ queryKey: getListProvidersQueryKey() }); } })} data-testid={`button-select-provider-${provider.id}`}>{t('select')}</Button>}</div></div>)}</div></Panel></QueryState><div className="space-y-6"><Panel className="p-5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-accent/20 text-foreground"><Gauge size={17} /></span><h2 className="mt-4 font-semibold">{t('selectedProvider')}</h2><p className="mt-1 text-sm text-muted-foreground">{selected ? `${selected.label} · ${selected.model}` : t('noProvider')}</p>{message && <p className="mt-4 rounded-lg bg-secondary p-3 text-xs font-semibold text-primary" data-testid="status-provider-updated">{message}</p>}</Panel><Panel className="p-5"><div className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck size={16} className="text-primary" /> {t('safeByDefault')}</div><p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t('safeByDefaultDescription')}</p></Panel></div></div></>;
}

function NotFoundPage() {
  const { t } = useI18n();
  return <div className="grid min-h-[70vh] place-items-center text-center"><div><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary"><CircleAlert size={24} /></span><h1 className="mt-5 text-2xl font-semibold">{t('notFoundTitle')}</h1><p className="mt-2 text-sm text-muted-foreground">{t('notFoundDescription')}</p><Link href="/" data-testid="link-not-found-home"><Button className="mt-6">{t('returnOverview')}</Button></Link></div></div>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><AppShell><Switch><Route path="/" component={DashboardPage} /><Route path="/lessons" component={LessonsPage} /><Route path="/lessons/:id" component={LessonDetailPage} /><Route path="/assessments" component={AssessmentsPage} /><Route path="/assessments/:id" component={AssessmentDetailPage} /><Route path="/homework" component={HomeworkPage} /><Route path="/homework/:id" component={HomeworkDetailPage} /><Route path="/upload" component={UploadCenterPage} /><Route path="/activity" component={ActivityPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFoundPage} /></Switch></AppShell></ErrorBoundary>;
}

function App() {
  return <I18nProvider><QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider></I18nProvider>;
}

export default App;