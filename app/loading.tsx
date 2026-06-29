import { AppHeader } from "@/components/layout/app-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-8 px-4 py-6 sm:px-6 xl:px-8">
      <AppHeader />

      <section className="grid gap-6">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="sub-panel space-y-4 px-5 py-5">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
          ))}
        </div>

        <div className="panel space-y-5 px-6 py-6">
          <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-3">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
            <div className="sub-panel space-y-3 px-5 py-5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-16 w-full rounded-2xl" />
              <Skeleton className="h-16 w-full rounded-2xl" />
            </div>
          </div>

          <div className="panel space-y-5 px-5 py-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <Skeleton className="h-12 w-full rounded-2xl" />
              <Skeleton className="h-12 w-full rounded-[28px]" />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-24 w-full rounded-[28px]" />
              <Skeleton className="h-24 w-full rounded-[28px]" />
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-1">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="panel space-y-5 px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Skeleton className="h-8 w-28 rounded-full" />
                      <Skeleton className="h-8 w-24 rounded-full" />
                    </div>
                    <Skeleton className="h-8 w-56" />
                    <Skeleton className="h-4 w-80" />
                  </div>
                  <div className="space-y-3">
                    <Skeleton className="h-11 w-36 rounded-2xl" />
                    <Skeleton className="h-11 w-36 rounded-2xl" />
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {Array.from({ length: 4 }).map((__, itemIndex) => (
                    <Skeleton key={itemIndex} className="h-20 w-full rounded-3xl" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
