import { useState } from 'react'
import { DEFAULT_PROFILE, today, targets, GOALS } from '../calc'
import { saveProfile } from '../hooks'
import { Field, Num, toNum } from '../ui'
import { SyncPanel } from './Settings'

export default function Welcome() {
  const [f, setF] = useState({ ...DEFAULT_PROFILE, startDate: today() })
  const [sync, setSync] = useState(false)
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const p = { ...f, age: toNum(f.age) || 25, height: toNum(f.height) || 178, weight: toNum(f.weight) || 85 }
  const t = targets(p)
  return (
    <div className="app" style={{ paddingBottom: 40 }}>
      <div style={{ padding: '28px 0 18px' }}>
        <div style={{ fontSize: 44 }}>🥊</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em' }}>Phoenix'e hoş geldin</h1>
        <p className="muted" style={{ marginTop: 6 }}>Boks, kickboks ve MMA yolculuğunda antrenmanını, beslenmeni, uykunu ve gelişimini tek yerden takip et.</p>
      </div>
      <div className="card col">
        <Field label="Adın (isteğe bağlı)"><input className="in" value={f.name} onChange={(e) => set('name')(e.target.value)} /></Field>
        <div className="row">
          <Field label="Yaş"><Num value={f.age} onChange={set('age')} /></Field>
          <Field label="Boy (cm)"><Num value={f.height} onChange={set('height')} /></Field>
          <Field label="Kilo (kg)"><Num value={f.weight} onChange={set('weight')} /></Field>
        </div>
        <div className="row">
          <Field label="Cinsiyet">
            <select className="in" value={f.sex} onChange={(e) => set('sex')(e.target.value)}>
              <option value="m">Erkek</option>
              <option value="f">Kadın</option>
            </select>
          </Field>
          <Field label="Hedef">
            <select className="in" value={f.goal} onChange={(e) => set('goal')(e.target.value)}>
              {Object.entries(GOALS).map(([k, g]) => <option key={k} value={k}>{g.name}</option>)}
            </select>
          </Field>
        </div>
      </div>
      <div className="card">
        <h3>Günlük hedefin</h3>
        <div className="row between">
          <div><div className="big">{t.kcal}</div><div className="muted small">kcal</div></div>
          <div className="center"><div className="b num">{t.protein} g</div><div className="muted tiny">protein</div></div>
          <div className="center"><div className="b num">{t.carbs} g</div><div className="muted tiny">karbonhidrat</div></div>
          <div className="center"><div className="b num">{t.fat} g</div><div className="muted tiny">yağ</div></div>
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>Haftada 4 dövüş dersi + 2 kuvvet antrenmanına göre hesaplandı. Her şeyi sonradan Ayarlar'dan değiştirebilirsin.</p>
      </div>
      <button className="btn full" onClick={() => saveProfile(p)}>Başlayalım</button>
      <button className="btn ghost full" style={{ marginTop: 10 }} onClick={() => setSync((s) => !s)}>Zaten hesabım var — verilerimi getir</button>
      {sync && <div style={{ marginTop: 12 }}><SyncPanel /></div>}
    </div>
  )
}
