// Günlük şınav takibi. Kayıt: { id: tarih, date, sets: [n, ...], total }
import { useState } from 'react'
import { useCol, put, getOne } from '../store'
import { today, addDays, fmtD, dow } from '../calc'
import { Num, toNum, toast } from '../ui'
import { BarChart } from '../Chart'

function save(date, sets) {
  put('pushups', { id: date, date, sets, total: sets.reduce((a, b) => a + b, 0) })
}
function addSet(date, n, goal) {
  const cur = getOne('pushups', date)
  const sets = [...(cur?.sets || []), n]
  const before = cur?.total || 0
  save(date, sets)
  if (before < goal && before + n >= goal) toast(`Günlük ${goal} şınav hedefi tamam 💪`)
}

// Hedefi tutan ardışık gün sayısı (bugün henüz tutmadıysa dünden sayar)
function pushStreak(by, goal) {
  let d = today()
  if ((by[d]?.total || 0) < goal) d = addDays(d, -1)
  let n = 0
  while ((by[d]?.total || 0) >= goal) {
    n++
    d = addDays(d, -1)
  }
  return n
}

export function PushupCard({ profile, date }) {
  const goal = profile.pushupGoal || 30
  const all = useCol('pushups')
  const by = Object.fromEntries(all.map((x) => [x.date, x]))
  const rec = by[date]
  const total = rec?.total || 0
  const [custom, setCustom] = useState('')
  const st = pushStreak(by, goal)
  const undo = () => rec?.sets?.length && save(date, rec.sets.slice(0, -1))
  const addCustom = () => {
    const n = Math.round(toNum(custom) || 0)
    if (n <= 0 || n > 500) return toast('Geçerli bir sayı gir')
    addSet(date, n, goal)
    setCustom('')
  }
  return (
    <div className="card">
      <div className="row between" style={{ marginBottom: 10 }}>
        <h3 style={{ margin: 0 }}>Şınav</h3>
        <span className={`chip ${st > 0 ? 'accent' : ''}`}>🔥 {st} gün seri</span>
      </div>
      <div className="row between" style={{ alignItems: 'baseline' }}>
        <div className="big">{total}<span className="muted small"> / {goal}</span></div>
        <div className="muted small num">{rec?.sets?.length ? rec.sets.join(' + ') : 'bugün henüz yok'}</div>
      </div>
      <div className="bar" style={{ margin: '10px 0 12px' }}><i style={{ width: `${Math.min(100, (total / goal) * 100)}%`, background: total >= goal ? 'var(--good)' : 'var(--accent)' }} /></div>
      <div className="row" style={{ gap: 8 }}>
        {[5, 10, 15, 20].map((n) => <button key={n} className="btn ghost sm grow" onClick={() => addSet(date, n, goal)}>+{n}</button>)}
      </div>
      <div className="row" style={{ gap: 8, marginTop: 8 }}>
        <Num value={custom} onChange={setCustom} placeholder="Başka sayı" aria-label="Şınav sayısı" style={{ minHeight: 40 }} onKeyDown={(e) => e.key === 'Enter' && addCustom()} />
        <button className="btn sm" onClick={addCustom}>Ekle</button>
        <button className="btn ghost sm" onClick={undo} disabled={!rec?.sets?.length}>Geri al</button>
      </div>
    </div>
  )
}

export function PushupStats({ profile }) {
  const goal = profile.pushupGoal || 30
  const all = useCol('pushups')
  const by = Object.fromEntries(all.map((x) => [x.date, x]))
  const d = today()
  const days = Array.from({ length: 30 }, (_, i) => addDays(d, i - 29))
  const total = all.reduce((a, x) => a + (x.total || 0), 0)
  const bestDay = Math.max(0, ...all.map((x) => x.total || 0))
  const bestSet = Math.max(0, ...all.flatMap((x) => x.sets || []))
  const last7 = days.slice(-7).reduce((a, x) => a + (by[x]?.total || 0), 0)
  const Tile = ({ l, v }) => (
    <div className="card" style={{ margin: 0, padding: 12 }}>
      <div className="muted tiny">{l}</div>
      <div className="big" style={{ fontSize: 22 }}>{v}</div>
    </div>
  )
  return (
    <>
      <div className="grid3 mb">
        <Tile l="Toplam" v={total.toLocaleString('tr-TR')} />
        <Tile l="Tek sette en iyi" v={bestSet} />
        <Tile l="Bir günde en iyi" v={bestDay} />
      </div>
      <div className="grid3 mb">
        <Tile l="Son 7 gün" v={last7} />
        <Tile l="Hedef serisi" v={`${pushStreak(by, goal)} gün`} />
        <Tile l="Günlük hedef" v={goal} />
      </div>
      <PushupCard profile={profile} date={d} />
      <div className="card">
        <h3>Son 30 gün</h3>
        <BarChart bars={days.map((x) => ({ label: fmtD(x), y: by[x]?.total || 0 }))} unit="şınav" target={goal} />
      </div>
      <div className="notice">
        💡 Formu bozmadan yapabildiğin kadar yap; gün içine yay (ör. 3 × 10). "Tek sette en iyi" değerin hedefinin yarısını geçtiğinde günlük hedefi Ayarlar'dan 10 artır. Göğüs ve omuzların çok ağrıdığı günlerde hedefi yarıya indirmek seriyi bozmaktan iyidir.
      </div>
    </>
  )
}
