import { Skeleton, SkeletonCard, SkeletonStat } from './Skeleton';

export function CenteredPageSkeleton() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="mt-6 h-4 w-40 rounded-full" />
          <Skeleton className="mt-3 h-3 w-56 rounded-full" />
          <Skeleton className="mt-2 h-3 w-44 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6 pb-10">
      <div className="overflow-hidden rounded-[16px] border border-slate-200 bg-white shadow-[0_8px_20px_rgba(108,99,255,0.12)]">
        <div className="p-6 bg-[linear-gradient(135deg,#6C63FF,#7C7AFF)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
            <Skeleton className="h-[72px] w-[72px] rounded-2xl bg-white/20" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-48 rounded-full bg-white/25" />
              <Skeleton className="h-4 w-64 rounded-full bg-white/20" />
              <Skeleton className="h-4 w-40 rounded-full bg-white/20" />
            </div>
            <Skeleton className="h-10 w-32 rounded-lg bg-white/20" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-[14px] border border-slate-200 bg-white p-6 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <Skeleton className="mb-5 h-5 w-44 rounded-full" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <Skeleton className="mb-3 h-3 w-24 rounded-full" />
                <Skeleton className="h-4 w-32 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-[14px] border border-slate-200 bg-white p-5 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
            <Skeleton className="mb-4 h-5 w-32 rounded-full" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <Skeleton className="mb-2 h-4 w-40 rounded-full" />
                  <Skeleton className="h-3 w-32 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CourseDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-40 rounded-full" />

      <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
          <Skeleton className="aspect-[16/9] w-full rounded-[1.75rem]" />
          <div className="space-y-4 py-1">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-8 w-4/5 rounded-full" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((item) => <SkeletonStat key={item} />)}
            </div>
            <Skeleton className="h-4 w-full rounded-full" />
            <Skeleton className="h-4 w-5/6 rounded-full" />
            <div className="flex gap-3 pt-2">
              <Skeleton className="h-11 w-48 rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-5">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="mt-3 h-7 w-56 rounded-full" />
        <Skeleton className="mt-2 h-4 w-2/3 rounded-full" />
        <div className="mt-6 space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-56 rounded-full" />
                    <Skeleton className="h-4 w-3/4 rounded-full" />
                    <div className="flex gap-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LearningWorkspaceSkeleton() {
  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-white">
      <div className="flex h-16 items-center justify-between border-b border-slate-100 bg-white/80 px-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-6 w-px" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-4 w-52 rounded-full" />
          </div>
        </div>
        <div className="hidden sm:block">
          <Skeleton className="h-8 w-40 rounded-full" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-[#F9FAFB]">
        <div className="hidden w-80 flex-shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="border-b border-slate-200 px-4 py-3">
            <Skeleton className="h-3 w-28 rounded-full" />
          </div>
          <div className="space-y-3 p-3">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-white p-3">
                <Skeleton className="mb-2 h-4 w-4/5 rounded-full" />
                <Skeleton className="h-3 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="space-y-4 px-6 pb-10 pt-6 lg:px-10">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="mt-2 h-7 w-3/5 rounded-full" />
              <Skeleton className="mt-2 h-4 w-2/5 rounded-full" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <Skeleton className="aspect-video w-full" />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <Skeleton className="mb-3 h-4 w-32 rounded-full" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AssessmentResultSkeleton() {
  return (
    <div className="min-h-screen bg-[#f1f4f9]">
      <main className="mx-auto w-full max-w-[1200px] space-y-6 p-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-7 w-52 rounded-full" />
              </div>
              <Skeleton className="h-4 w-64 rounded-full" />
              <Skeleton className="h-4 w-48 rounded-full" />
            </div>
            <div className="flex flex-wrap gap-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-xl border border-slate-200 bg-white px-5 py-4">
                  <Skeleton className="h-3 w-16 rounded-full" />
                  <Skeleton className="mt-3 h-8 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-8">
          <Skeleton className="h-4 w-32 rounded-full" />
          <div className="mt-8 space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <Skeleton className="h-5 w-3/4 rounded-full" />
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {[1, 2, 3, 4].map((option) => (
                    <Skeleton key={option} className="h-14 w-full rounded-2xl" />
                  ))}
                </div>
                <Skeleton className="mt-5 h-16 w-full rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export function AdminListSkeleton({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4"
        >
          <Skeleton className="h-11 w-11 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-40 rounded-full" />
            <Skeleton className="h-3 w-56 rounded-full" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AssessmentGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((index) => (
        <div key={index} className="space-y-4">
          <SkeletonCard />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
