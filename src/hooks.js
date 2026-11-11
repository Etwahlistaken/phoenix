import { useMemo } from 'react'
import { useCol, useOne, put } from './store'
import { DEFAULT_PROFILE, targets, levelOf, streak } from './calc'

export function useProfile() {
  const p = useOne('profile', 'main')
  return useMemo(() => (p ? { ...DEFAULT_PROFILE, ...p } : null), [p])
}
export const saveProfile = (p) => put('profile', { ...p, id: 'main' })
export const useTargets = (p) => useMemo(() => targets(p), [p])

export function useStats(profile) {
  const workouts = useCol('workouts')
  const food = useCol('food')
  const sleep = useCol('sleep')
  const body = useCol('body')
  const skills = useCol('skills')
  return useMemo(() => {
    const foodDays = new Set(food.map((f) => f.date)).size
    const skillPts = skills.reduce((s, k) => s + (k.rating || 0), 0)
    const xp = workouts.length * 50 + foodDays * 15 + sleep.length * 5 + body.length * 20 + skillPts * 10
    const st = streak(workouts, profile)
    const fights = workouts.filter((w) => ['boks', 'kickboks', 'mma'].includes(w.type)).length
    const badges = [
      ['🥊', 'İlk adım', 'İlk antrenmanını kaydet', workouts.length >= 1],
      ['🔟', 'Çift hane', '10 antrenman', workouts.length >= 10],
      ['💯', 'Yüzler kulübü', '100 antrenman', workouts.length >= 100],
      ['🔥', 'Bir hafta seri', '7 günlük seri', st >= 7],
      ['⚡', 'Bir ay seri', '30 günlük seri', st >= 30],
      ['🤼', 'Minderde 25 ders', '25 dövüş dersi', fights >= 25],
      ['🍽️', 'Hesabını bilen', '14 gün beslenme kaydı', foodDays >= 14],
      ['😴', 'Uyku düzeni', '14 gece uyku kaydı', sleep.length >= 14],
      ['📏', 'Ölçüyorum', '4 vücut ölçümü', body.length >= 4],
      ['🎓', 'Teknik direk', '10 tekniği puanla', skills.filter((k) => k.rating).length >= 10],
    ]
    return { xp, level: levelOf(xp), streak: st, badges, foodDays }
  }, [workouts, food, sleep, body, skills, profile])
}
