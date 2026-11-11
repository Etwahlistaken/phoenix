import { useCol, put, getOne } from '../store'
import { useStats, useTargets } from '../hooks'
import { today, dow, fmtLong, TYPES, sumMacros, r0, r1, addDays, weekStart, DAYS_S, programWeek, parseD } from '../calc'
import { phaseFor, DAY_NOTES, TIPS } from '../data/program'
import { Ring, MacroBar, toast } from '../ui'

export default function Today({ profile, nav }) {
  const d = today()
  const t = useTargets(profile)
  const stats = useStats(profile)
  const workouts = useCol('workouts')
  const food = useCol('food').filter((f) => f.date === d)
  const water = useCol('water').find((w) => w.id === d)?.ml || 0
  const sleep = useCol('sleep').find((s) => s.date === d)
  const body = useCol('body')
  const m = sumMacros(food)
  const planned = profile.schedule[dow(d)]
  const type = TYPES[planned]
  const doneToday = workouts.filter((w) => w.date === d)
  const burned = doneToday.reduce((s, w) => s + (w.kcal || 0), 0)
  const ws = weekStart(d)
  const week = programWeek(profile)
  const phase = phaseFor(week)
  const lastBody = body.map((b) => b.date).sort().pop()
  const weighDue = dow(d) === profile.weighDay && lastBody !== d
  const tip = TIPS[Math.floor(parseD(d).getTime() / 86400000) % TIPS.length]
  const lv = stats.level
  const addWater = (ml) => {
    const cur = getOne('water', d)?.ml || 0
    put('water', { id: d, date: d, ml: Math.max(0, cur + ml) })
  }
  const weekDone = Array.from({ length: 7 }, (_, i) => workouts.some((w) => w.date === addDays(ws, i)))
  const plannedCount = profile.schedule.filter((s) => s !== 'dinlenme').length
  const doneCount = weekDone.filter(Boolean).length
  return (
    <>
      <div className="hdr">
        <div>
          <div className="sub">{fmtLong(d)}</div>
          <h1>{profile.name ? `Selam, ${profile.name}` : 'Bugün'}</h1>
        </div>
        <button className="iconbtn" onClick={nav.openSettings} aria-label="Ayarlar">⚙️</button>
      </div>

      {weighDue && (
        <button className="notice" style={{ width: '100%', textAlign: 'left' }} onClick={() => nav.go('progress')}>
          ⚖️ <b>Bugün tartı ve ölçüm günü.</b> Sabah aç karnına tartıl, ölçülerini gir ›
        </button>
      )}

      <div className="card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Bugünün planı</h3>
          <span className="chip">{week}. hafta · {phase.name}</span>
        </div>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="emo" style={{ width: 52, height: 52, fontSize: 26 }}>{type.icon}</div>
          <div className="grow">
            <div className="b" style={{ fontSize: 18 }}>{type.name}</div>
            <div className="muted small">{DAY_NOTES[planned] || 'Antrenman detayları için programa bak. Isınmayı atlama.'}</div>
          </div>
        </div>
        {doneToday.length > 0 ? (
          <div className="notice good" style={{ margin: '12px 0 0' }}>
            ✅ <b>Bugün tamam!</b> {doneToday.map((w) => TYPES[w.type]?.name).join(' + ')} · {doneToday.reduce((s, w) => s + w.min, 0)} dk · {burned} kcal
          </div>
        ) : null}
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn grow" onClick={() => nav.logWorkout({ type: planned === 'dinlenme' ? 'yuruyus' : planned })}>
            {doneToday.length ? '+ Bir antrenman daha' : planned === 'dinlenme' ? 'Aktivite kaydet' : 'Antrenmanı kaydet'}
          </button>
          <button className="btn ghost" onClick={() => nav.go('train')}>Program</button>
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Beslenme</h3>
          {burned > 0 && <span className="chip">🔥 {burned} kcal yakıldı</span>}
        </div>
        <div className="row" style={{ gap: 16 }}>
          <Ring value={m.kcal} max={t.kcal} color={m.kcal > t.kcal * 1.05 ? 'var(--bad)' : 'var(--accent)'}>
            <div className="big" style={{ fontSize: 24 }}>{r0(Math.abs(t.kcal - m.kcal))}</div>
            <div className="muted tiny">{m.kcal > t.kcal ? 'kcal fazla' : 'kcal kaldı'}</div>
          </Ring>
          <div className="grow col" style={{ gap: 12 }}>
            <MacroBar label="Protein" value={m.p} max={t.protein} color="var(--c1)" />
            <MacroBar label="Karbonhidrat" value={m.c} max={t.carbs} color="var(--c2)" />
            <MacroBar label="Yağ" value={m.f} max={t.fat} color="var(--c3)" />
          </div>
        </div>
        <button className="btn ghost full" style={{ marginTop: 14 }} onClick={() => nav.go('food')}>+ Öğün ekle</button>
      </div>

      <div className="grid2 mb">
        <div className="card">
          <h3>Su</h3>
          <div className="big">{r1(water / 1000)}<span className="muted small"> / {r1(profile.waterGoal / 1000)} L</span></div>
          <div className="bar" style={{ margin: '10px 0' }}><i style={{ width: `${Math.min(100, (water / profile.waterGoal) * 100)}%`, background: 'var(--c1)' }} /></div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn ghost sm grow" onClick={() => addWater(250)}>+250 ml</button>
            <button className="btn ghost sm" onClick={() => addWater(-250)} aria-label="250 ml azalt">−</button>
          </div>
        </div>
        <div className="card">
          <h3>Uyku</h3>
          {sleep ? (
            <>
              <div className="big">{sleep.hours}<span className="muted small"> saat</span></div>
              <div className="muted small" style={{ margin: '8px 0' }}>{sleep.bed} → {sleep.wake}</div>
              <span className={`chip ${sleep.hours >= profile.sleepGoal - 0.5 ? 'good' : ''}`}>{sleep.hours >= profile.sleepGoal - 0.5 ? 'Hedefte' : `Hedef ${profile.sleepGoal} sa`}</span>
            </>
          ) : (
            <>
              <div className="muted small" style={{ marginBottom: 10 }}>Dün geceyi henüz girmedin.</div>
              <button className="btn ghost sm full" onClick={() => nav.go('progress')}>Uykunu gir</button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="row between" style={{ marginBottom: 10 }}>
          <h3 style={{ margin: 0 }}>Bu hafta</h3>
          <span className="chip">{doneCount} / {plannedCount} antrenman</span>
        </div>
        <div className="week">
          {profile.schedule.map((s, i) => (
            <div key={i} className={`d ${addDays(ws, i) === d ? 'today' : ''} ${weekDone[i] ? 'done' : ''}`}>
              {DAYS_S[i]}
              <span className="e">{weekDone[i] ? '✅' : TYPES[s].icon}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="row between">
          <div>
            <h3 style={{ marginBottom: 4 }}>Seviye {lv.n}</h3>
            <div className="b" style={{ fontSize: 18 }}>{lv.name}</div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="chip accent">🔥 {stats.streak} gün seri</span>
            <span className="chip">{lv.xp} XP</span>
          </div>
        </div>
        {lv.next && (
          <>
            <div className="bar" style={{ margin: '12px 0 6px' }}><i style={{ width: `${((lv.xp - lv.base) / (lv.next - lv.base)) * 100}%`, background: 'var(--accent)' }} /></div>
            <div className="muted tiny">Sonraki seviyeye {lv.next - lv.xp} XP · antrenman 50, beslenme günü 15, ölçüm 20 XP</div>
          </>
        )}
      </div>

      <div className="card">
        <h3>Günün notu</h3>
        <p>💡 {tip}</p>
      </div>
    </>
  )
}
