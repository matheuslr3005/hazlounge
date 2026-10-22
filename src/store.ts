import { create } from 'zustand'

type ReservationTab = 'event' | 'rental'
type Phase = 'intro' | 'site'

type AppState = {
  /** 'intro' while the 3D loading table is on screen */
  phase: Phase
  finishIntro: () => void
  /** true once the hero scene is mounted (it compiles under the loading screen) */
  heroWarm: boolean
  warmHero: () => void
  /** true once the hero scene finished compiling and rendered its first frame */
  heroReady: boolean
  setHeroReady: () => void

  reserveTab: ReservationTab
  reserveEventId: string | null
  openReservation: (tab: ReservationTab, eventId?: string) => void
}

export const useApp = create<AppState>((set) => ({
  phase: 'intro',
  finishIntro: () => set({ phase: 'site', heroWarm: true }),
  heroWarm: false,
  warmHero: () => set({ heroWarm: true }),
  heroReady: false,
  setHeroReady: () => set({ heroReady: true }),

  reserveTab: 'event',
  reserveEventId: null,
  openReservation: (tab, eventId) =>
    set((state) => ({ reserveTab: tab, reserveEventId: eventId ?? state.reserveEventId })),
}))
