// Supabase ile eşitleme: kirli kayıtları gönder, son çekmeden sonra değişenleri al.
import { useSyncExternalStore } from 'react'
import { createClient } from '@supabase/supabase-js'
import { dirtyRecords, markClean, mergeRemote, getMeta, setMeta, subscribe, markAllDirty } from './store'

const CFG_KEY = 'kose-sync-cfg'
let client = null
let status = { configured: false, user: null, state: 'off', lastSync: null, error: null }
const subs = new Set()
const setStatus = (p) => {
  status = { ...status, ...p }
  subs.forEach((f) => f())
}
export const useSync = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => status
  )

export function getConfig() {
  try {
    const c = JSON.parse(localStorage.getItem(CFG_KEY))
    if (c?.url && c?.key) return c
  } catch {}
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return url && key ? { url, key } : null
}

export function saveConfig(url, key) {
  url = url.trim().replace(/\/+$/, '')
  key = key.trim()
  if (!/^https:\/\/.+/.test(url) || key.length < 20) throw new Error('Adres veya anahtar hatalı görünüyor')
  localStorage.setItem(CFG_KEY, JSON.stringify({ url, key }))
  init()
}
export function clearConfig() {
  localStorage.removeItem(CFG_KEY)
  client = null
  setStatus({ configured: false, user: null, state: 'off', error: null })
}

export function init() {
  const cfg = getConfig()
  if (!cfg) return
  try {
    client = createClient(cfg.url, cfg.key)
  } catch (e) {
    setStatus({ configured: false, error: e.message })
    return
  }
  setStatus({ configured: true, state: 'idle', error: null })
  client.auth.onAuthStateChange((_e, session) => {
    const prev = status.user?.id
    setStatus({ user: session?.user ? { id: session.user.id, email: session.user.email } : null })
    if (session?.user && session.user.id !== prev) setTimeout(syncNow, 0)
  })
}

export async function signIn(email, password) {
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw new Error(trErr(error.message))
}
export async function signUp(email, password) {
  const { data, error } = await client.auth.signUp({ email, password })
  if (error) throw new Error(trErr(error.message))
  return data.session ? 'ok' : 'confirm'
}
export async function signOut() {
  await client.auth.signOut()
  // Başka bir hesapla girilirse her şey yeniden gönderilsin
  markAllDirty()
}
function trErr(m) {
  if (/Invalid login/i.test(m)) return 'E-posta veya şifre hatalı'
  if (/not confirmed/i.test(m)) return 'E-postanıza gelen onay bağlantısına tıklayın'
  if (/already registered/i.test(m)) return 'Bu e-posta zaten kayıtlı, giriş yapın'
  if (/at least 6/i.test(m)) return 'Şifre en az 6 karakter olmalı'
  return m
}

let running = false
let again = false
export async function syncNow() {
  if (!client || !status.user) return
  if (running) {
    again = true
    return
  }
  running = true
  setStatus({ state: 'syncing', error: null })
  try {
    // 1) çek
    const since = getMeta().lastPull
    let from = 0
    let maxSynced = since
    for (;;) {
      let q = client.from('records').select('collection,id,data,client_ts,synced_at').order('synced_at').range(from, from + 999)
      if (since) q = q.gt('synced_at', since)
      const { data, error } = await q
      if (error) throw error
      mergeRemote(data)
      if (data.length) maxSynced = data[data.length - 1].synced_at
      if (data.length < 1000) break
      from += 1000
    }
    if (maxSynced !== since) setMeta({ lastPull: maxSynced })
    // 2) gönder
    const dirty = dirtyRecords()
    for (let i = 0; i < dirty.length; i += 200) {
      const chunk = dirty.slice(i, i + 200)
      const rows = chunk.map(({ col, rec }) => {
        const { _d, id, ts, ...data } = rec
        return { user_id: status.user.id, collection: col, id, data, client_ts: ts }
      })
      const { error } = await client.from('records').upsert(rows, { onConflict: 'user_id,collection,id' })
      if (error) throw error
      markClean(chunk)
    }
    setStatus({ state: 'idle', lastSync: new Date().toISOString() })
  } catch (e) {
    setStatus({ state: 'error', error: e.message || String(e) })
  } finally {
    running = false
    if (again) {
      again = false
      syncNow()
    }
  }
}

let t = null
export function startAutoSync() {
  init()
  subscribe((local) => {
    if (!local) return
    clearTimeout(t)
    t = setTimeout(syncNow, 2500)
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') syncNow()
  })
  window.addEventListener('online', syncNow)
}
