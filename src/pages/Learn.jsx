import { useState } from 'react'
import { useCol, put } from '../store'
import { today, r1 } from '../calc'
import { TECHNIQUES, TECH_CATS } from '../data/techniques'
import { Seg, Stars, toast } from '../ui'

export default function Learn() {
  const [cat, setCat] = useState('boks')
  const skills = useCol('skills')
  const by = Object.fromEntries(skills.map((s) => [s.id, s]))
  const rate = (t, r) => {
    const cur = by[t.id]
    const history = [...(cur?.history || []).filter((h) => h.d !== today()), { d: today(), r }]
    put('skills', { id: t.id, rating: r, history })
    if (r > (cur?.rating || 0)) toast(`${t.name}: ${r}/5 — gelişiyorsun 👊`)
  }
  const avg = (c) => {
    const list = TECHNIQUES.filter((t) => t.cat === c)
    return r1(list.reduce((s, t) => s + (by[t.id]?.rating || 0), 0) / list.length)
  }
  return (
    <>
      <div className="hdr">
        <div>
          <div className="sub">Derste çalıştığın tekniği puanla, gelişimini gör</div>
          <h1>Öğren</h1>
        </div>
      </div>
      <div className="card">
        <h3>Teknik seviyen</h3>
        <div className="col" style={{ gap: 12 }}>
          {TECH_CATS.map(([c, name], i) => (
            <div key={c}>
              <div className="row between small" style={{ marginBottom: 5 }}><span>{name}</span><span className="num"><b>{avg(c)}</b><span className="muted"> / 5</span></span></div>
              <div className="bar"><i style={{ width: `${(avg(c) / 5) * 100}%`, background: `var(--c${i + 1})` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <Seg value={cat} onChange={setCat} options={TECH_CATS} />
      {TECHNIQUES.filter((t) => t.cat === cat).map((t) => {
        const s = by[t.id]
        const first = s?.history?.[0]
        return (
          <details className="card" key={t.id}>
            <summary>
              <div className="row between">
                <div className="b" style={{ fontSize: 16 }}>{t.name}</div>
                <span className="muted small num">{s?.rating ? `${s.rating}/5` : 'puanlanmadı'} ▾</span>
              </div>
              <div className="muted small" style={{ marginTop: 4 }}>{t.desc}</div>
            </summary>
            <div className="col" style={{ marginTop: 12, gap: 10 }}>
              <div>
                <div className="b small" style={{ marginBottom: 4 }}>Kilit noktalar</div>
                {t.keys.map((k) => <p key={k} className="small" style={{ padding: '2px 0' }}>✓ {k}</p>)}
              </div>
              <p className="small"><b>Sık yapılan hata:</b> {t.mistake}</p>
              <p className="small"><b>Tek başına çalışma:</b> {t.drill}</p>
              <div className="row between" style={{ borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                <div>
                  <div className="small b">Kendini puanla</div>
                  <div className="muted tiny">{first && s.history.length > 1 ? `İlk puanın ${first.r}/5 idi` : '1 = yeni öğrendim · 5 = sparringde kullanıyorum'}</div>
                </div>
                <Stars value={s?.rating || 0} onChange={(r) => rate(t, r)} />
              </div>
            </div>
          </details>
        )
      })}
      <p className="muted tiny center">Açıklamalar hatırlatma amaçlıdır; tekniği antrenörünün gösterdiği şekilde uygula.</p>
    </>
  )
}
