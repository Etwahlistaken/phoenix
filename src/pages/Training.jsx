import { useMemo, useState } from 'react'
import { useCol, put, remove } from '../store'
import { today, TYPES, burnKcal, DAYS, dow, fmtLong, fmtD, programWeek, weekStart, addDays, planMinutes } from '../calc'
import { phaseFor, PHASES, WORKOUTS, EXERCISES, DAY_NOTES } from '../data/program'
import { Sheet, Seg, Field, Num, toNum, toast } from '../ui'
import { BarChart } from '../Chart'

export default function Training({ profile, nav }) {
  const [view, setView] = useState('program')
  const workouts = useCol('workouts')
  const week = programWeek(profile)
  const phase = phaseFor(week)
  const d = today()
  const sorted = useMemo(() => [...workouts].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.ts - a.ts)), [workouts])
  const weeks = useMemo(() => {
    const ws = weekStart(d)
    return Array.from({ length: 8 }, (_, i) => {
      const s = addDays(ws, -7 * (7 - i))
      const e = addDays(s, 6)
      const list = workouts.filter((w) => w.date >= s && w.date <= e)
      return { label: fmtD(s), min: list.reduce((a, w) => a + w.min, 0), kcal: list.reduce((a, w) => a + (w.kcal || 0), 0) }
    })
  }, [workouts, d])
  return (
    <>
      <div className="hdr">
        <div>
          <div className="sub">{week}. hafta · {phase.name} evresi</div>
          <h1>Antrenman</h1>
        </div>
        <button className="btn sm" onClick={() => nav.logWorkout({})}>+ Kaydet</button>
      </div>
      <Seg value={view} onChange={setView} options={[['program', 'Program'], ['history', 'Geçmiş'], ['stats', 'İstatistik']]} />

      {view === 'program' && (
        <>
          <div className="card">
            <h3>Bu evre: {phase.name} ({phase.from}-{phase.to}. hafta)</h3>
            <p className="small">{phase.desc}</p>
            <div className="row wrap" style={{ marginTop: 10, gap: 8 }}>
              <span className="chip">{phase.sets} set</span>
              <span className="chip">{phase.reps} tekrar</span>
              <span className="chip">Dinlenme {phase.rest}</span>
            </div>
          </div>
          {profile.schedule.map((s, i) => {
            const t = TYPES[s]
            const w = WORKOUTS[s]
            const isToday = dow(d) === i
            return (
              <details key={i} className="card" open={isToday}>
                <summary className="row">
                  <div className="emo">{t.icon}</div>
                  <div className="grow">
                    <div className="b">{DAYS[i]} {isToday && <span className="chip accent" style={{ marginLeft: 6 }}>bugün</span>}</div>
                    <div className="muted small">{w ? w.title : t.name}{planMinutes(s) ? ` · ~${planMinutes(s)} dk` : ''}</div>
                  </div>
                  <span className="muted">▾</span>
                </summary>
                <div style={{ marginTop: 12 }}>
                  {w ? (
                    <>
                      <p className="small muted mb"><b>Isınma:</b> {w.warmup}</p>
                      {w.list.map((id, n) => {
                        const ex = EXERCISES[id]
                        return (
                          <details key={id} className="li" style={{ display: 'block' }}>
                            <summary className="row between">
                              <span><span className="muted num">{n + 1}.</span> <b>{ex.name}</b></span>
                              <span className="muted small num">{phase.sets} × {ex.timed ? 'süre' : phase.reps}</span>
                            </summary>
                            <p className="small" style={{ marginTop: 8 }}>{ex.how}</p>
                            <p className="small muted" style={{ marginTop: 4 }}>💡 {ex.tip}</p>
                          </details>
                        )
                      })}
                      {w.finisher && <p className="small" style={{ marginTop: 10 }}>🔥 {w.finisher}</p>}
                    </>
                  ) : (
                    <p className="small">{DAY_NOTES[s]}</p>
                  )}
                  {s !== 'dinlenme' && <button className="btn ghost sm full" style={{ marginTop: 12 }} onClick={() => nav.logWorkout({ type: s, date: isToday ? d : undefined })}>Bu antrenmanı kaydet</button>}
                </div>
              </details>
            )
          })}
          <div className="card">
            <h3>24 haftalık yol haritası</h3>
            {PHASES.map((p) => (
              <div key={p.name} className="li">
                <div className="grow">
                  <div className="t">{p.from}-{p.to}. hafta · {p.name}</div>
                  <div className="muted small">{p.sets} set × {p.reps} tekrar</div>
                </div>
                {p === phase && <span className="chip accent">buradasın</span>}
              </div>
            ))}
            <p className="muted small" style={{ marginTop: 10 }}>Haftalık günleri Ayarlar › Haftalık program bölümünden değiştirebilirsin.</p>
          </div>
        </>
      )}

      {view === 'history' && (
        <div className="card">
          {sorted.length === 0 && <div className="empty">Henüz kayıt yok. İlk antrenmanından sonra buraya ekle — her kayıt 50 XP.</div>}
          {sorted.map((w) => (
            <button key={w.id} className="li" onClick={() => nav.logWorkout({ edit: w })}>
              <div className="emo">{TYPES[w.type]?.icon}</div>
              <div className="grow">
                <div className="t">{TYPES[w.type]?.name}{w.sparring ? ' · sparring' : ''}</div>
                <div className="muted small">{fmtLong(w.date)} · {w.min} dk · zorluk {w.rpe}/10</div>
              </div>
              <div className="b num">{w.kcal}<span className="muted tiny"> kcal</span></div>
            </button>
          ))}
        </div>
      )}

      {view === 'stats' && (
        <>
          <div className="grid3 mb">
            <Stat n={workouts.length} l="antrenman" />
            <Stat n={Math.round(workouts.reduce((a, w) => a + w.min, 0) / 60)} l="saat" />
            <Stat n={workouts.reduce((a, w) => a + (w.kcal || 0), 0).toLocaleString('tr-TR')} l="kcal" />
          </div>
          <div className="card"><h3>Haftalık antrenman süresi (dk)</h3><BarChart bars={weeks.map((w) => ({ label: w.label, y: w.min }))} unit="dk" /></div>
          <div className="card"><h3>Haftalık yakılan kalori</h3><BarChart bars={weeks.map((w) => ({ label: w.label, y: w.kcal }))} unit="kcal" color="var(--c2)" /></div>
          <StrengthProgress workouts={workouts} />
        </>
      )}
    </>
  )
}

const Stat = ({ n, l }) => (
  <div className="card center" style={{ margin: 0, padding: 12 }}>
    <div className="big" style={{ fontSize: 22 }}>{n}</div>
    <div className="muted tiny">{l}</div>
  </div>
)

function StrengthProgress({ workouts }) {
  const rows = []
  for (const [id, ex] of Object.entries(EXERCISES)) {
    const hist = workouts
      .filter((w) => w.sets?.[id]?.some((s) => s.reps))
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((w) => w.sets[id].filter((s) => s.reps).reduce((best, s) => ((s.kg || 0) > (best.kg || 0) || ((s.kg || 0) === (best.kg || 0) && s.reps > best.reps) ? s : best)))
    if (hist.length) rows.push([ex, hist[0], hist[hist.length - 1], hist.length])
  }
  return (
    <div className="card">
      <h3>Kuvvet gelişimi (en iyi set)</h3>
      {rows.length === 0 ? (
        <div className="empty">Kuvvet antrenmanlarında set/tekrar girdikçe burada ilk ve son değerlerin görünür.</div>
      ) : (
        <table className="tbl">
          <thead><tr><th>Hareket</th><th>İlk</th><th>Son</th></tr></thead>
          <tbody>
            {rows.map(([ex, a, b]) => (
              <tr key={ex.name}><td>{ex.name}</td><td>{fmtSet(a, ex)}</td><td className="b">{fmtSet(b, ex)}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
const fmtSet = (s, ex) => (ex.timed ? `${s.kg ? s.kg + ' kg · ' : ''}${s.reps} sn` : `${s.kg ? s.kg + ' kg × ' : ''}${s.reps}`)

const LOG_TYPES = ['bokskick', 'boks', 'kickboks', 'mma', 'kuvvetA', 'kuvvetB', 'kondisyon', 'torba', 'kosu', 'ip', 'yuruyus', 'mobilite']

export function WorkoutForm({ profile, init, onClose }) {
  const e = init.edit
  const workouts = useCol('workouts')
  const [f, setF] = useState(() =>
    e
      ? { ...e }
      : { date: init.date || today(), type: init.type && init.type !== 'dinlenme' ? init.type : 'bokskick', min: planMinutes(init.type || 'bokskick'), rpe: 6, rounds: '', sparring: false, good: '', improve: '', sets: {} }
  )
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const t = TYPES[f.type]
  const plan = WORKOUTS[f.type]
  const min = toNum(f.min) || 0
  const kcal = burnKcal(f.type, min, profile.weight, f.rpe)
  const phase = phaseFor(programWeek(profile, f.date))
  // Bu hareketin bir önceki kaydı (ilerleme için referans)
  const last = (exId) => {
    const prev = workouts.filter((w) => w.id !== f.id && w.date <= f.date && w.sets?.[exId]?.some((s) => s.reps)).sort((a, b) => (a.date < b.date ? 1 : -1))[0]
    return prev ? prev.sets[exId].filter((s) => s.reps).map((s) => (s.kg ? `${s.kg}×${s.reps}` : s.reps)).join(', ') : null
  }
  const setSet = (exId, i, k, v) =>
    setF((s) => {
      const arr = [...(s.sets?.[exId] || [])]
      while (arr.length <= i) arr.push({})
      arr[i] = { ...arr[i], [k]: v }
      return { ...s, sets: { ...s.sets, [exId]: arr } }
    })
  const save = () => {
    if (!min) return toast('Süreyi gir')
    const sets = {}
    for (const [id, arr] of Object.entries(f.sets || {})) {
      const clean = arr.map((x) => ({ kg: toNum(x.kg), reps: toNum(x.reps) })).filter((x) => x.reps)
      if (clean.length) sets[id] = clean
    }
    put('workouts', { ...f, min, rounds: toNum(f.rounds), kcal, sets })
    toast(e ? 'Güncellendi' : `Kaydedildi · +50 XP · ${kcal} kcal 🔥`)
    onClose()
  }
  return (
    <Sheet title={e ? 'Antrenmanı düzenle' : 'Antrenman kaydet'} onClose={onClose}>
      <div className="col">
        <div className="row">
          <Field label="Tür">
            <select className="in" value={f.type} onChange={(ev) => setF((s) => ({ ...s, type: ev.target.value, min: e ? s.min : planMinutes(ev.target.value) }))}>
              {LOG_TYPES.map((k) => <option key={k} value={k}>{TYPES[k].icon} {TYPES[k].name}</option>)}
            </select>
          </Field>
          <Field label="Tarih"><input className="in" type="date" max={today()} value={f.date} onChange={(ev) => set('date')(ev.target.value)} /></Field>
        </div>
        <div className="row">
          <Field label="Süre (dk)"><Num value={f.min} onChange={set('min')} /></Field>
          {t.fight || f.type === 'torba' ? <Field label="Raunt sayısı"><Num value={f.rounds} onChange={set('rounds')} placeholder="isteğe bağlı" /></Field> : null}
        </div>
        <Field label={`Zorluk: ${f.rpe}/10 — ${['', 'çok hafif', 'çok hafif', 'hafif', 'hafif', 'orta', 'orta', 'zor', 'zor', 'çok zor', 'tükendim'][f.rpe]}`}>
          <input type="range" min="1" max="10" value={f.rpe} onChange={(ev) => set('rpe')(+ev.target.value)} style={{ width: '100%', accentColor: 'var(--accent)', height: 36 }} />
        </Field>
        <div className="notice" style={{ margin: 0 }}>🔥 Tahmini yakılan: <b>{kcal} kcal</b> <span className="muted small">({profile.weight} kg, süre ve zorluğa göre)</span></div>

        {t.fight && (
          <>
            <label className="row" style={{ minHeight: 44 }}>
              <input type="checkbox" checked={!!f.sparring} onChange={(ev) => set('sparring')(ev.target.checked)} style={{ width: 22, height: 22, accentColor: 'var(--accent)' }} />
              <span>Sparring yaptım</span>
            </label>
            <Field label="Bugün ne öğrendim / ne iyi gitti?"><textarea className="in" value={f.good || ''} onChange={(ev) => set('good')(ev.target.value)} placeholder="ör. jab-direkt-low kick kombinasyonu, gard daha iyi" /></Field>
            <Field label="Neyi geliştirmeliyim?"><textarea className="in" value={f.improve || ''} onChange={(ev) => set('improve')(ev.target.value)} placeholder="ör. yorulunca eller düşüyor" /></Field>
          </>
        )}

        {plan && (
          <div>
            <div className="muted small" style={{ marginBottom: 6 }}>Hedef: {phase.sets} set × {phase.reps} tekrar. Boş bıraktığın setler kaydedilmez.</div>
            {plan.list.map((id) => {
              const ex = EXERCISES[id]
              const prev = last(id)
              const n = Math.max(3, (f.sets?.[id] || []).length)
              return (
                <div key={id} className="card" style={{ padding: 12, marginBottom: 8 }}>
                  <div className="b">{ex.name}</div>
                  <div className="muted tiny" style={{ marginBottom: 8 }}>{prev ? `Geçen sefer: ${prev}` : ex.tip}</div>
                  {Array.from({ length: Math.min(4, n + 0) }, (_, i) => (
                    <div key={i} className="row" style={{ marginBottom: 6, gap: 8 }}>
                      <span className="muted small num" style={{ width: 44 }}>{i + 1}. set</span>
                      <Num value={f.sets?.[id]?.[i]?.kg} onChange={(v) => setSet(id, i, 'kg', v)} placeholder="kg" aria-label={`${ex.name} ${i + 1}. set kg`} style={{ minHeight: 40 }} />
                      <Num value={f.sets?.[id]?.[i]?.reps} onChange={(v) => setSet(id, i, 'reps', v)} placeholder={ex.timed ? 'saniye' : 'tekrar'} aria-label={`${ex.name} ${i + 1}. set tekrar`} style={{ minHeight: 40 }} />
                    </div>
                  ))}
                  {n < 4 && <button className="muted small" onClick={() => setSet(id, n, 'kg', f.sets?.[id]?.[n - 1]?.kg ?? '')}>+ 4. set</button>}
                </div>
              )
            })}
          </div>
        )}

        {!t.fight && <Field label="Not"><textarea className="in" value={f.good || ''} onChange={(ev) => set('good')(ev.target.value)} /></Field>}
        <button className="btn full" onClick={save}>{e ? 'Güncelle' : 'Kaydet'}</button>
        {e && <button className="btn danger full" onClick={() => { if (window.confirm('Bu antrenman silinsin mi?')) { remove('workouts', e.id); onClose() } }}>Sil</button>}
      </div>
    </Sheet>
  )
}
