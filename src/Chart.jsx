// Küçük, bağımlılıksız SVG grafikler: çizgi ve çubuk. Dokunma/fare ile değer okuma.
import { useEffect, useRef, useState } from 'react'

function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(320)
  useEffect(() => {
    if (!ref.current) return
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, e.contentRect.width)))
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

function niceTicks(min, max, n = 4) {
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  const raw = span / n
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const step = [1, 2, 5, 10].map((m) => m * mag).find((s) => s >= raw) || raw
  const lo = Math.floor(min / step) * step
  const hi = Math.ceil(max / step) * step
  const ticks = []
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v * 1000) / 1000)
  return ticks
}
const fmt = (v) => (Math.abs(v) >= 100 ? Math.round(v) : Math.round(v * 10) / 10).toLocaleString('tr-TR')

// points: [{ label, y }]  (x eşit aralıklı)
export function LineChart({ points, unit = '', color = 'var(--c1)', height = 170, target, zero = false }) {
  const [ref, W] = useWidth()
  const [hi, setHi] = useState(null)
  if (points.length < 2)
    return <div ref={ref} className="empty">Grafik için en az 2 kayıt gerekli{points.length === 1 ? ` (şu an: ${fmt(points[0].y)} ${unit})` : ''}.</div>
  const pad = { l: 38, r: 12, t: 12, b: 22 }
  const ys = points.map((p) => p.y).concat(target != null ? [target] : [])
  const ticks = niceTicks(zero ? 0 : Math.min(...ys), Math.max(...ys))
  const y0 = ticks[0]
  const y1 = ticks[ticks.length - 1]
  const iw = W - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const X = (i) => pad.l + (iw * i) / (points.length - 1)
  const Y = (v) => pad.t + ih - ((v - y0) / (y1 - y0)) * ih
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)},${Y(p.y).toFixed(1)}`).join('')
  const move = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const i = Math.round(((cx - pad.l) / iw) * (points.length - 1))
    setHi(Math.max(0, Math.min(points.length - 1, i)))
  }
  const labelIdx = points.length <= 6 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1]
  return (
    <div ref={ref} className="chart" onMouseMove={move} onMouseLeave={() => setHi(null)} onTouchStart={move} onTouchMove={move} onTouchEnd={() => setHi(null)}>
      {hi != null && (
        <div className="tipbox" style={{ left: Math.max(50, Math.min(W - 50, X(hi))) }}>
          <span className="muted">{points[hi].label}</span> <b>{fmt(points[hi].y)}</b> {unit}
        </div>
      )}
      <svg height={height} viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Çizgi grafik">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(t)} y2={Y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={pad.l - 6} y={Y(t) + 4} textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {target != null && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={Y(target)} y2={Y(target)} stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={W - pad.r} y={Y(target) - 5} textAnchor="end">hedef {fmt(target)}</text>
          </g>
        )}
        {labelIdx.map((i) => (
          <text key={i} x={X(i)} y={height - 5} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>{points[i].label}</text>
        ))}
        <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.length <= 30 && points.map((p, i) => <circle key={i} cx={X(i)} cy={Y(p.y)} r="3" fill={color} stroke="var(--s1)" strokeWidth="1.5" />)}
        {hi != null && (
          <g>
            <line x1={X(hi)} x2={X(hi)} y1={pad.t} y2={pad.t + ih} stroke="var(--muted)" strokeWidth="1" />
            <circle cx={X(hi)} cy={Y(points[hi].y)} r="5" fill={color} stroke="var(--s1)" strokeWidth="2" />
          </g>
        )}
      </svg>
    </div>
  )
}

// bars: [{ label, y }]
export function BarChart({ bars, unit = '', color = 'var(--c1)', height = 160, target }) {
  const [ref, W] = useWidth()
  const [hi, setHi] = useState(null)
  const pad = { l: 38, r: 8, t: 12, b: 22 }
  const max = Math.max(1, ...bars.map((b) => b.y), target || 0)
  const ticks = niceTicks(0, max, 3)
  const y1 = ticks[ticks.length - 1]
  const iw = W - pad.l - pad.r
  const ih = height - pad.t - pad.b
  const bw = iw / bars.length
  const w = Math.min(28, bw - 4)
  const Y = (v) => pad.t + ih - (v / y1) * ih
  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    const i = Math.floor((cx - pad.l) / bw)
    setHi(i >= 0 && i < bars.length ? i : null)
  }
  const every = Math.ceil(bars.length / 8)
  return (
    <div ref={ref} className="chart" onMouseMove={pick} onMouseLeave={() => setHi(null)} onTouchStart={pick} onTouchMove={pick} onTouchEnd={() => setHi(null)}>
      {hi != null && (
        <div className="tipbox" style={{ left: Math.max(50, Math.min(W - 50, pad.l + bw * (hi + 0.5))) }}>
          <span className="muted">{bars[hi].label}</span> <b>{fmt(bars[hi].y)}</b> {unit}
        </div>
      )}
      <svg height={height} viewBox={`0 0 ${W} ${height}`} role="img" aria-label="Çubuk grafik">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(t)} y2={Y(t)} stroke="var(--line)" strokeWidth="1" />
            <text x={pad.l - 6} y={Y(t) + 4} textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {bars.map((b, i) => {
          const h = Math.max(b.y > 0 ? 2 : 0, ih - (Y(b.y) - pad.t))
          const x = pad.l + bw * i + (bw - w) / 2
          const r = Math.min(4, h)
          return (
            <g key={i}>
              {h > 0 && <path d={`M${x},${pad.t + ih} v${-(h - r)} q0,${-r} ${r},${-r} h${w - 2 * r} q${r},0 ${r},${r} v${h - r} z`} fill={color} opacity={hi == null || hi === i ? 1 : 0.5} />}
              {i % every === 0 && <text x={x + w / 2} y={height - 5} textAnchor="middle">{b.label}</text>}
            </g>
          )
        })}
        {target != null && (
          <g>
            <line x1={pad.l} x2={W - pad.r} y1={Y(target)} y2={Y(target)} stroke="var(--muted)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={W - pad.r} y={Y(target) - 5} textAnchor="end">hedef {fmt(target)}</text>
          </g>
        )}
      </svg>
    </div>
  )
}
