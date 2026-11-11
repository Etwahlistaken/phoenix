import { useEffect, useState, useSyncExternalStore } from 'react'

export function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => (document.body.style.overflow = prev)
  }, [])
  return (
    <div className="sheet-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="sheet-h">
          <h2>{title}</h2>
          <button className="iconbtn" onClick={onClose} aria-label="Kapat">✕</button>
        </div>
        <div className="sheet-b">{children}</div>
      </div>
    </div>
  )
}

export function Seg({ value, onChange, options }) {
  return (
    <div className="seg">
      {options.map(([v, label]) => (
        <button key={v} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{label}</button>
      ))}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  )
}

// Sayı girişi: boş bırakılabilir, virgül kabul eder
export function Num({ value, onChange, ...rest }) {
  return (
    <input
      className="in"
      inputMode="decimal"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value.replace(',', '.').replace(/[^0-9.]/g, ''))}
      {...rest}
    />
  )
}
export const toNum = (v) => {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : undefined
}

export function Ring({ value, max, size = 120, stroke = 11, color = 'var(--accent)', children }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const f = Math.max(0, Math.min(1, max ? value / max : 0))
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--s2)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${c * f} ${c}`} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>{children}</div>
      </div>
    </div>
  )
}

export function MacroBar({ label, value, max, color, unit = 'g' }) {
  const over = value > max * 1.08
  return (
    <div className="grow">
      <div className="row between small" style={{ marginBottom: 5 }}>
        <span className="muted">{label}</span>
        <span className="num"><b>{Math.round(value)}</b><span className="muted"> / {max} {unit}</span></span>
      </div>
      <div className="bar"><i style={{ width: `${Math.min(100, (value / max) * 100)}%`, background: over ? 'var(--bad)' : color }} /></div>
    </div>
  )
}

export function Stars({ value, onChange, max = 5 }) {
  return (
    <div className="stars" role="radiogroup">
      {Array.from({ length: max }, (_, i) => (
        <button key={i} className={i < value ? 'on' : ''} aria-label={`${i + 1} yıldız`} onClick={() => onChange(i + 1 === value ? i : i + 1)}>★</button>
      ))}
    </div>
  )
}

// ---- toast ----
let toastMsg = null
const tsubs = new Set()
let tt
export function toast(msg) {
  toastMsg = msg
  tsubs.forEach((f) => f())
  clearTimeout(tt)
  tt = setTimeout(() => {
    toastMsg = null
    tsubs.forEach((f) => f())
  }, 2400)
}
export function Toast() {
  const m = useSyncExternalStore((f) => (tsubs.add(f), () => tsubs.delete(f)), () => toastMsg)
  return m ? <div className="toast" role="status">{m}</div> : null
}

export function DateNav({ date, onChange, today, fmt }) {
  const shift = (n) => {
    const [y, m, d] = date.split('-').map(Number)
    const x = new Date(y, m - 1, d + n)
    onChange(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`)
  }
  return (
    <div className="row between mb">
      <button className="iconbtn" onClick={() => shift(-1)} aria-label="Önceki gün">‹</button>
      <button className="b" onClick={() => onChange(today)}>{date === today ? 'Bugün' : fmt(date)}</button>
      <button className="iconbtn" onClick={() => shift(1)} disabled={date >= today} style={{ opacity: date >= today ? 0.3 : 1 }} aria-label="Sonraki gün">›</button>
    </div>
  )
}

export function useConfirm() {
  return (msg) => window.confirm(msg)
}
