import { useSyncExternalStore } from 'react'
import type { HistoryEntry, UserData, UserPreferences, ViewingProgress } from '../types'

// User data lives behind a small backend interface. The prototype persists to
// localStorage; an account-sync backend can implement the same two methods.

export interface UserDataBackend {
  load(): UserData | null
  save(data: UserData): void
}

const KEY = 'cableera:user:v1'

export const localBackend: UserDataBackend = {
  load() {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as UserData) : null
    } catch {
      return null
    }
  },
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data))
    } catch {
      // Storage full or blocked (private mode). The session still works in memory.
    }
  },
}

export const DEFAULT_PREFS: UserPreferences = {
  theme: 'classic',
  guideDensity: 'comfortable',
  landing: 'home',
  autoplayNext: true,
  guidePreviews: true,
  captions: true,
  motion: 'system',
  scanlines: false,
  bootEffect: true,
  preferredEras: [],
  birthYear: null,
  services: [],
}

function fresh(): UserData {
  return {
    version: 1,
    favoriteShows: [],
    favoriteChannels: [],
    savedShows: [],
    progress: {},
    history: [],
    recentChannels: [],
    lastChannel: null,
    prefs: DEFAULT_PREFS,
  }
}

const backend: UserDataBackend = localBackend
const loaded = backend.load()
let state: UserData = loaded ? { ...fresh(), ...loaded, prefs: { ...DEFAULT_PREFS, ...loaded.prefs } } : fresh()
const listeners = new Set<() => void>()

function set(next: UserData) {
  state = next
  backend.save(state)
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useUserData(): UserData {
  return useSyncExternalStore(subscribe, () => state)
}

export const getUserData = () => state

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [id, ...list])

export const actions = {
  toggleFavoriteShow: (id: string) => set({ ...state, favoriteShows: toggle(state.favoriteShows, id) }),
  toggleFavoriteChannel: (id: string) => set({ ...state, favoriteChannels: toggle(state.favoriteChannels, id) }),
  toggleSavedShow: (id: string) => set({ ...state, savedShows: toggle(state.savedShows, id) }),

  saveProgress(p: Omit<ViewingProgress, 'updatedAt' | 'completed'>) {
    const completed = p.durationSec > 0 && p.positionSec >= p.durationSec - 15
    set({ ...state, progress: { ...state.progress, [p.episodeId]: { ...p, completed, updatedAt: Date.now() } } })
  },

  recordView(entry: Omit<HistoryEntry, 'at'>) {
    const last = state.history[0]
    // Don't record the same thing twice in a row (e.g. a remount).
    if (last && last.episodeId === entry.episodeId && last.channelId === entry.channelId) return
    set({ ...state, history: [{ ...entry, at: Date.now() }, ...state.history].slice(0, 200) })
  },

  tuneChannel(id: string) {
    set({ ...state, lastChannel: id, recentChannels: [id, ...state.recentChannels.filter((c) => c !== id)].slice(0, 8) })
  },

  toggleService: (id: string) =>
    set({ ...state, prefs: { ...state.prefs, services: toggle(state.prefs.services, id) } }),

  setPrefs: (patch: Partial<UserPreferences>) => set({ ...state, prefs: { ...state.prefs, ...patch } }),

  clearHistory: () => set({ ...state, history: [], progress: {}, recentChannels: [] }),
  resetAll: () => set(fresh()),
}
