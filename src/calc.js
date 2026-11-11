// Tarih yardımcıları ve hesaplamalar
export const pad = (n) => String(n).padStart(2, '0')
export const dstr = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const today = () => dstr()
export const parseD = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (s, n) => {
  const d = parseD(s)
  d.setDate(d.getDate() + n)
  return dstr(d)
}
export const diffDays = (a, b) => Math.round((parseD(a) - parseD(b)) / 86400000)
// Pazartesi = 0
export const dow = (s) => (parseD(s).getDay() + 6) % 7
export const weekStart = (s) => addDays(s, -dow(s))
export const DAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
export const DAYS_S = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara']
export const fmtD = (s) => {
  const d = parseD(s)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}
export const fmtLong = (s) => `${fmtD(s)} ${DAYS[dow(s)]}`
export const r0 = (n) => Math.round(n || 0)
export const r1 = (n) => Math.round((n || 0) * 10) / 10

// ---- Antrenman türleri (MET: Compendium of Physical Activities yaklaşık değerleri) ----
export const TYPES = {
  bokskick: { name: 'Boks + Kickboks', met: 8.2, icon: '🥊', fight: true },
  boks: { name: 'Boks', met: 7.8, icon: '🥊', fight: true },
  kickboks: { name: 'Kickboks', met: 8.5, icon: '🦵', fight: true },
  mma: { name: 'MMA', met: 8.5, icon: '🤼', fight: true },
  kuvvetA: { name: 'Kuvvet A', met: 4.5, icon: '🏋️' },
  kuvvetB: { name: 'Kuvvet B', met: 5, icon: '🏋️' },
  kondisyon: { name: 'Kondisyon (HIIT)', met: 8, icon: '🔥' },
  torba: { name: 'Kum torbası', met: 5.8, icon: '🥊' },
  kosu: { name: 'Koşu', met: 8.3, icon: '🏃' },
  ip: { name: 'İp atlama', met: 10, icon: '➰' },
  yuruyus: { name: 'Yürüyüş', met: 3.5, icon: '🚶' },
  mobilite: { name: 'Esneme / Mobilite', met: 2.5, icon: '🧘' },
  dinlenme: { name: 'Dinlenme', met: 0, icon: '😴' },
}
// RPE (1-10) yoğunluk düzeltmesi: 6 = nötr
export const burnKcal = (type, minutes, kg, rpe = 6) => {
  const met = TYPES[type]?.met || 5
  const f = 1 + (rpe - 6) * 0.05
  return r0(met * f * kg * (minutes / 60))
}

// ---- Beslenme hedefleri ----
export const DEFAULT_PROFILE = {
  id: 'main',
  name: '',
  sex: 'm',
  age: 25,
  height: 178,
  weight: 85,
  goal: 'recomp',
  proteinPerKg: 2,
  startDate: null,
  // Pzt..Paz
  schedule: ['kuvvetA', 'bokskick', 'mma', 'bokskick', 'mma', 'kuvvetB', 'dinlenme'],
  pushupGoal: 30,
  waterGoal: 3000,
  sleepGoal: 8,
  bedtime: '23:30',
  weighDay: 0,
}
const PLAN_MIN = { bokskick: 60, boks: 60, kickboks: 60, mma: 60, kuvvetA: 55, kuvvetB: 60, kondisyon: 30, torba: 30, kosu: 30, ip: 15, yuruyus: 40, mobilite: 20, dinlenme: 0 }
export const planMinutes = (t) => PLAN_MIN[t] ?? 30

export const GOALS = {
  recomp: { name: 'Yağ yak + kas kazan', adj: -0.12 },
  cut: { name: 'Hızlı yağ yakımı', adj: -0.2 },
  maintain: { name: 'Koruma', adj: 0 },
  bulk: { name: 'Kas kazanımı (hafif fazla)', adj: 0.08 },
}

export function targets(p) {
  const w = p.weight
  // Mifflin-St Jeor
  const bmr = 10 * w + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161)
  // Masa başı günlük hareket + planlı antrenmanların net kalorisi
  const weeklyEx = (p.schedule || []).reduce((s, t) => s + Math.max(0, (TYPES[t]?.met || 0) - 1) * w * (planMinutes(t) / 60), 0)
  const tdee = bmr * 1.25 + weeklyEx / 7
  const kcal = Math.round((tdee * (1 + (GOALS[p.goal]?.adj ?? 0))) / 10) * 10
  const protein = r0(w * (p.proteinPerKg || 2))
  const fat = r0(w * 0.9)
  const carbs = Math.max(50, r0((kcal - protein * 4 - fat * 9) / 4))
  return { bmr: r0(bmr), tdee: r0(tdee), kcal, protein, fat, carbs }
}

// ABD Donanması yöntemi ile yağ oranı tahmini (erkek / kadın)
export function navyFat(p, m) {
  if (!m.waist || !m.neck) return null
  let bf
  if (p.sex === 'm') {
    if (m.waist - m.neck <= 0) return null
    bf = 495 / (1.0324 - 0.19077 * Math.log10(m.waist - m.neck) + 0.15456 * Math.log10(p.height)) - 450
  } else {
    if (!m.hip) return null
    bf = 495 / (1.29579 - 0.35004 * Math.log10(m.waist + m.hip - m.neck) + 0.221 * Math.log10(p.height)) - 450
  }
  return bf > 2 && bf < 60 ? r1(bf) : null
}

export const sumMacros = (items) =>
  items.reduce(
    (a, i) => ({ kcal: a.kcal + (i.kcal || 0), p: a.p + (i.p || 0), c: a.c + (i.c || 0), f: a.f + (i.f || 0) }),
    { kcal: 0, p: 0, c: 0, f: 0 }
  )

// "23:30" -> "07:15" süresi (saat)
export function sleepHours(bed, wake) {
  if (!bed || !wake) return 0
  const [bh, bm] = bed.split(':').map(Number)
  const [wh, wm] = wake.split(':').map(Number)
  let mins = wh * 60 + wm - (bh * 60 + bm)
  if (mins <= 0) mins += 1440
  return r1(mins / 60)
}

// Program haftası (1'den başlar) ve evre
export function programWeek(p, date = today()) {
  if (!p.startDate) return 1
  return Math.max(1, Math.floor(diffDays(weekStart(date), weekStart(p.startDate)) / 7) + 1)
}

// Seri: bugünden (veya dünden) geriye, planlı dinlenme günleri seriyi bozmaz
export function streak(workouts, p) {
  const done = new Set(workouts.map((w) => w.date))
  let d = today()
  let n = 0
  if (!done.has(d)) d = addDays(d, -1)
  for (let i = 0; i < 400; i++) {
    if (done.has(d)) n++
    else if ((p.schedule || [])[dow(d)] !== 'dinlenme') break
    d = addDays(d, -1)
  }
  return n
}

export const LEVELS = [
  [0, 'Çaylak'],
  [300, 'Acemi'],
  [800, 'Çırak'],
  [1600, 'Mücadeleci'],
  [3000, 'Sağlam'],
  [5000, 'Tecrübeli'],
  [8000, 'Usta adayı'],
  [12000, 'Usta'],
]
export function levelOf(xp) {
  let i = 0
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1][0]) i++
  const next = LEVELS[i + 1]
  return { n: i + 1, name: LEVELS[i][1], xp, base: LEVELS[i][0], next: next ? next[0] : null }
}
