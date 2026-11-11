// Yerel-öncelikli veri deposu. Her kayıt: { id, ts, del?, _d?, ...alanlar }
// _d = buluta henüz gönderilmedi işareti.
import { useSyncExternalStore } from 'react'

const KEY = 'kose-db-v1'
let state = load()
let version = 0
const listeners = new Set()
const cache = new Map()

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (s && s.cols) return s
  } catch {}
  return { cols: {}, meta: { lastPull: null } }
}

let saveTimer = null
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch (e) {
      console.error('Kaydedilemedi', e)
    }
  }, 150)
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => {
    clearTimeout(saveTimer)
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {}
  })
}

function changed(local = true) {
  version++
  cache.clear()
  persist()
  listeners.forEach((l) => l(local))
}

export function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8)

export function put(col, rec) {
  const id = rec.id || uid()
  const full = { ...rec, id, ts: Date.now(), _d: 1 }
  delete full.del
  state.cols[col] = { ...(state.cols[col] || {}), [id]: full }
  changed()
  return full
}

export function remove(col, id) {
  if (!state.cols[col]?.[id]) return
  state.cols[col] = { ...state.cols[col], [id]: { id, ts: Date.now(), del: true, _d: 1 } }
  changed()
}

export function getAll(col) {
  const k = col
  if (!cache.has(k)) cache.set(k, Object.values(state.cols[col] || {}).filter((r) => !r.del))
  return cache.get(k)
}

export const getOne = (col, id) => {
  const r = state.cols[col]?.[id]
  return r && !r.del ? r : undefined
}

export function useCol(col) {
  return useSyncExternalStore(subscribe, () => getAll(col))
}
export function useOne(col, id) {
  return useSyncExternalStore(subscribe, () => getOne(col, id))
}
export function useVersion() {
  return useSyncExternalStore(subscribe, () => version)
}

// ---- eşitleme için alt seviye erişim ----
export function dirtyRecords() {
  const out = []
  for (const [col, recs] of Object.entries(state.cols))
    for (const r of Object.values(recs)) if (r._d) out.push({ col, rec: r })
  return out
}
export function markClean(items) {
  for (const { col, rec } of items) {
    const cur = state.cols[col]?.[rec.id]
    if (cur && cur.ts === rec.ts) {
      const { _d, ...rest } = cur
      state.cols[col] = { ...state.cols[col], [rec.id]: rest }
    }
  }
  persist()
}
export function mergeRemote(rows) {
  let n = 0
  for (const row of rows) {
    const cur = state.cols[row.collection]?.[row.id]
    if (!cur || row.client_ts > cur.ts) {
      const rec = { ...row.data, id: row.id, ts: row.client_ts }
      delete rec._d
      state.cols[row.collection] = { ...(state.cols[row.collection] || {}), [row.id]: rec }
      n++
    }
  }
  if (n) changed(false)
  return n
}
export const getMeta = () => state.meta
export function setMeta(patch) {
  state.meta = { ...state.meta, ...patch }
  persist()
}
export function markAllDirty() {
  for (const col of Object.keys(state.cols)) {
    const next = {}
    for (const r of Object.values(state.cols[col])) next[r.id] = { ...r, _d: 1 }
    state.cols[col] = next
  }
  state.meta = { ...state.meta, lastPull: null }
  persist()
}

// ---- yedekleme ----
export const exportJSON = () => JSON.stringify(state, null, 1)
export function importJSON(text) {
  const s = JSON.parse(text)
  if (!s || !s.cols) throw new Error('Geçersiz yedek dosyası')
  state = { cols: s.cols, meta: { lastPull: null } }
  markAllDirty()
  changed()
}
export function wipeAll() {
  state = { cols: {}, meta: { lastPull: null } }
  changed(false)
}
