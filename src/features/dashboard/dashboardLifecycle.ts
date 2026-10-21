import { localDate } from "../../domain/records/validation";
/** Calculate the next LOCAL midnight with calendar arithmetic, including DST days. */
export function millisecondsToNextDay(now: Date): number {
  const midnight = new Date(now.getTime());
  midnight.setHours(24, 0, 0, 0);
  return Math.max(1, midnight.getTime() - now.getTime() + 100);
}
interface LifecycleOptions {
  now: () => Date;
  refresh: () => Promise<void>;
  onDate: (date: string) => void;
  schedule: (callback: () => void, delay: number) => () => void;
}
/** One timer while focused and foregrounded; no polling, no render-driven queries. */
export function createDashboardLifecycle({
  now,
  refresh,
  onDate,
  schedule,
}: LifecycleOptions) {
  let cancel: (() => void) | undefined;
  let running = false;
  let lastDate: string | undefined;
  function updateDate() {
    const today = localDate(now());
    if (today !== lastDate) {
      lastDate = today;
      onDate(today);
    }
  }
  function arm() {
    cancel?.();
    cancel = schedule(() => {
      if (!running) return;
      updateDate();
      void refresh();
      arm();
    }, millisecondsToNextDay(now()));
  }
  return {
    activate() {
      if (running) return;
      running = true;
      updateDate();
      void refresh();
      arm();
    },
    suspend() {
      running = false;
      cancel?.();
      cancel = undefined;
    },
  };
}
