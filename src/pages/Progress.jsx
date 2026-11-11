import { useMemo, useState } from 'react'
import { useCol, put, remove, getOne } from '../store'
import { useStats, useTargets, saveProfile } from '../hooks'
import { today, addDays, fmtD, fmtLong, navyFat, sleepHours, r0, r1, weekStart, sumMacros, TYPES, parseD, dstr } from '../calc'
import { Sheet, Seg, Field, Num, toNum, Stars, toast } from '../ui'
import { LineChart, BarChart } from '../Chart'

export default function Progress({ profile }) {
  const [view, setView] = useState('body')
  return (
    <>
      <div className="hdr"><h1>Gelişim</h1></div>
      <Seg value={view} onChange={setView} options={[['body', 'Vücut'], ['sleep', 'Uyku'], ['report', 'Rapor'], ['badges', 'Rozetler']]} />
      {view === 'body' && <Body profile={profile} />}
      {view === 'sleep' && <Sleep profile={profile} />}
      {view === 'report' && <Report profile={profile} />}
      {view === 'badges' && <Badges profile={profile} />}
    </>
  )
}

const BODY_FIELDS = [
  ['weight', 'Kilo (kg)'],
  ['waist', 'Bel (cm)'],
  ['neck', 'Boyun (cm)'],
  ['chest', 'Göğüs (cm)'],
  ['arm', 'Kol (cm)'],
  ['thigh', 'Bacak (cm)'],
  ['hip', 'Kalça (cm)'],
]

function Body({ profile }) {
  const body = useCol('body')
  const [form, setForm] = useState(null)
  const [metric, setMetric] = useState('weight')
  const sorted = useMemo(() => [...body].sort((a, b) => (a.date < b.date ? -1 : 1)), [body])
  const withFat = sorted.map((b) => ({ ...b, fat: b.bf ?? navyFat(profile, b) }))
  const last = withFat[withFat.length - 1]
  const first = withFat[0]
  const lastOf = (k) => [...withFat].reverse().find((b) => b[k] != null)
  const firstOf = (k) => withFat.find((b) => b[k] != null)
  const delta = (k) => {
    const a = firstOf(k), b = lastOf(k)
    return a && b && a !== b ? r1(b[k] - a[k]) : null
  }
  const lf = lastOf('fat')
  const lean = lf && lf.weight ? r1(lf.weight * (1 - lf.fat / 100)) : null
  const ff = firstOf('fat')
  const lean0 = ff && ff.weight && ff !== lf ? r1(ff.weight * (1 - ff.fat / 100)) : null
  const METRICS = [['weight', 'Kilo', 'kg'], ['fat', 'Yağ %', '%'], ['lean', 'Yağsız kütle', 'kg'], ['waist', 'Bel', 'cm'], ['chest', 'Göğüs', 'cm'], ['arm', 'Kol', 'cm'], ['thigh', 'Bacak', 'cm']]
  const mm = METRICS.find((m) => m[0] === metric)
  const series = withFat
    .map((b) => ({ label: fmtD(b.date), y: metric === 'lean' ? (b.fat != null && b.weight ? r1(b.weight * (1 - b.fat / 100)) : null) : b[metric] }))
    .filter((p) => p.y != null)
  const Tile = ({ label, value, unit, d, goodDown }) => (
    <div className="card" style={{ margin: 0, padding: 12 }}>
      <div className="muted tiny">{label}</div>
      <div className="big" style={{ fontSize: 22 }}>{value ?? '—'}<span className="muted small"> {value != null ? unit : ''}</span></div>
      {d != null && d !== 0 && <div className="tiny" style={{ color: (d < 0) === goodDown ? 'var(--good)' : 'var(--text2)' }}>{d > 0 ? '▲ +' : '▼ '}{d} {unit} <span className="muted">başlangıçtan</span></div>}
    </div>
  )
  return (
    <>
      <div className="grid3 mb">
        <Tile label="Kilo" value={lastOf('weight')?.weight} unit="kg" d={delta('weight')} goodDown />
        <Tile label="Yağ oranı" value={lf?.fat} unit="%" d={delta('fat')} goodDown />
        <Tile label="Yağsız kütle" value={lean} unit="kg" d={lean != null && lean0 != null ? r1(lean - lean0) : null} goodDown={false} />
      </div>
      <button className="btn full mb" onClick={() => setForm({ date: today() })}>+ Ölçüm ekle</button>
      <div className="card">
        <div className="seg" style={{ background: 'transparent', padding: 0 }}>
          {METRICS.map(([k, l]) => <button key={k} className={k === metric ? 'on' : ''} onClick={() => setMetric(k)}>{l}</button>)}
        </div>
        <LineChart points={series} unit={mm[2]} color={metric === 'fat' ? 'var(--c2)' : metric === 'lean' ? 'var(--c3)' : 'var(--c1)'} />
      </div>
      <div className="card">
        <h3>Ölçüm geçmişi</h3>
        {sorted.length === 0 && <div className="empty">İlk ölçümünü ekle. Bel ve boyun ölçüsünü girersen yağ oranın otomatik tahmin edilir. Haftada bir, aynı gün sabah aç karnına ölçmek en doğrusu.</div>}
        {[...withFat].reverse().map((b) => (
          <button key={b.id} className="li" onClick={() => setForm(b)}>
            <div className="grow">
              <div className="t">{fmtLong(b.date)}</div>
              <div className="muted small num">{[b.waist && `bel ${b.waist}`, b.chest && `göğüs ${b.chest}`, b.arm && `kol ${b.arm}`, b.thigh && `bacak ${b.thigh}`].filter(Boolean).join(' · ') || 'sadece kilo'}</div>
            </div>
            <div className="num" style={{ textAlign: 'right' }}><div className="b">{b.weight ? `${b.weight} kg` : '—'}</div>{b.fat != null && <div className="muted tiny">%{b.fat} yağ</div>}</div>
          </button>
        ))}
      </div>
      <p className="muted tiny center">Yağ oranı, bel-boyun-boy ölçülerinden ABD Donanması formülüyle tahmin edilir (±3-4 puan hata payı). Önemli olan sayının kendisi değil, zaman içindeki yönüdür.</p>
      {form && <BodyForm init={form} profile={profile} onClose={() => setForm(null)} />}
    </>
  )
}

function BodyForm({ init, profile, onClose }) {
  const [f, setF] = useState({ ...init })
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const nums = Object.fromEntries([...BODY_FIELDS.map((x) => x[0]), 'bf'].map((k) => [k, toNum(f[k])]))
  const est = navyFat(profile, nums)
  const save = () => {
    if (!Object.values(nums).some((v) => v != null)) return toast('En az bir değer gir')
    if (init.id && init.id !== f.date) remove('body', init.id)
    put('body', { id: f.date, date: f.date, ...nums })
    const latest = !getOne('body', addDays(f.date, 1)) && f.date >= today()
    if (nums.weight && latest && nums.weight !== profile.weight) saveProfile({ ...profile, weight: nums.weight })
    toast('Ölçüm kaydedildi · +20 XP')
    onClose()
  }
  return (
    <Sheet title="Vücut ölçümü" onClose={onClose}>
      <div className="col">
        <Field label="Tarih"><input className="in" type="date" max={today()} value={f.date} onChange={(e) => set('date')(e.target.value)} /></Field>
        <div className="grid2" style={{ gap: 10 }}>
          {BODY_FIELDS.filter(([k]) => k !== 'hip' || profile.sex === 'f').map(([k, l]) => <Field key={k} label={l}><Num value={f[k]} onChange={set(k)} /></Field>)}
          <Field label="Yağ % (cihazla ölçtüysen)"><Num value={f.bf} onChange={set('bf')} placeholder={est != null ? `tahmin: ${est}` : ''} /></Field>
        </div>
        <p className="muted small">Bel: göbek deliği hizasından, nefes verdikten sonra. Boyun: gırtlağın hemen altından. Kol: pazı gevşekken en kalın yer. {est != null && <b>Tahmini yağ oranı: %{est}</b>}</p>
        <button className="btn full" onClick={save}>Kaydet</button>
        {init.id && <button className="btn danger full" onClick={() => { remove('body', init.id); onClose() }}>Sil</button>}
      </div>
    </Sheet>
  )
}

function Sleep({ profile }) {
  const sleep = useCol('sleep')
  const [form, setForm] = useState(null)
  const d = today()
  const days = Array.from({ length: 14 }, (_, i) => addDays(d, i - 13))
  const byDate = Object.fromEntries(sleep.map((s) => [s.date, s]))
  const recent = days.map((x) => byDate[x]).filter(Boolean)
  const avg = recent.length ? r1(recent.reduce((a, s) => a + s.hours, 0) / recent.length) : null
  // Yatış saati tutarlılığı: 18:00'dan itibaren dakika cinsinden standart sapma
  const bedMin = recent.map((s) => { const [h, m] = s.bed.split(':').map(Number); return ((h * 60 + m - 18 * 60 + 1440) % 1440) })
  const mean = bedMin.reduce((a, b) => a + b, 0) / (bedMin.length || 1)
  const sd = bedMin.length > 2 ? Math.round(Math.sqrt(bedMin.reduce((a, b) => a + (b - mean) ** 2, 0) / bedMin.length)) : null
  const avgBed = bedMin.length ? (() => { const t = Math.round(mean + 18 * 60) % 1440; return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}` })() : null
  return (
    <>
      <div className="grid3 mb">
        <Mini l="Ortalama (14 gün)" v={avg != null ? `${avg} sa` : '—'} />
        <Mini l="Ort. yatış saati" v={avgBed || '—'} />
        <Mini l="Yatış sapması" v={sd != null ? `±${sd} dk` : '—'} good={sd != null && sd <= 45} />
      </div>
      <button className="btn full mb" onClick={() => setForm(byDate[d] || { date: d, bed: profile.bedtime, wake: '07:30', quality: 3 })}>{byDate[d] ? 'Dün geceyi düzenle' : '+ Dün geceki uykumu gir'}</button>
      <div className="card">
        <h3>Son 14 gece (saat)</h3>
        <BarChart bars={days.map((x) => ({ label: fmtD(x).split(' ')[0], y: byDate[x]?.hours || 0 }))} unit="saat" target={profile.sleepGoal} color="var(--c1)" />
      </div>
      {sd != null && (
        <div className={`notice ${sd <= 45 ? 'good' : ''}`}>
          {sd <= 45 ? '👏 Yatış saatin tutarlı. Düzenli uyku toparlanmayı ve kas gelişimini doğrudan etkiler.' : `🕰️ Yatış saatin günden güne ortalama ±${sd} dk oynuyor. Hedef: her gece ${profile.bedtime} civarı, hafta sonu dahil. Yatmadan 1 saat önce ekranı bırak, 14:00'ten sonra kafein alma.`}
        </div>
      )}
      <div className="card">
        <h3>Kayıtlar</h3>
        {sleep.length === 0 && <div className="empty">Her sabah yatış ve kalkış saatini gir; uyku düzenin burada görünür.</div>}
        {[...sleep].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 30).map((s) => (
          <button className="li" key={s.id} onClick={() => setForm(s)}>
            <div className="grow"><div className="t">{fmtLong(s.date)}</div><div className="muted small num">{s.bed} → {s.wake} · {'★'.repeat(s.quality || 0)}</div></div>
            <div className="b num">{s.hours} sa</div>
          </button>
        ))}
      </div>
      {form && <SleepForm init={form} onClose={() => setForm(null)} />}
    </>
  )
}
const Mini = ({ l, v, good }) => (
  <div className="card" style={{ margin: 0, padding: 12 }}>
    <div className="muted tiny">{l}</div>
    <div className="big" style={{ fontSize: 20, color: good ? 'var(--good)' : undefined }}>{v}</div>
  </div>
)

function SleepForm({ init, onClose }) {
  const [f, setF] = useState({ ...init })
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const hours = sleepHours(f.bed, f.wake)
  const save = () => {
    if (init.id && init.id !== f.date) remove('sleep', init.id)
    put('sleep', { id: f.date, date: f.date, bed: f.bed, wake: f.wake, quality: f.quality, hours })
    toast('Uyku kaydedildi')
    onClose()
  }
  return (
    <Sheet title="Uyku kaydı" onClose={onClose}>
      <div className="col">
        <Field label="Uyandığın gün"><input className="in" type="date" max={today()} value={f.date} onChange={(e) => set('date')(e.target.value)} /></Field>
        <div className="row">
          <Field label="Yattım"><input className="in" type="time" value={f.bed} onChange={(e) => set('bed')(e.target.value)} /></Field>
          <Field label="Kalktım"><input className="in" type="time" value={f.wake} onChange={(e) => set('wake')(e.target.value)} /></Field>
        </div>
        <div className="row between"><span>Uyku kalitesi</span><Stars value={f.quality || 0} onChange={set('quality')} /></div>
        <div className="notice" style={{ margin: 0 }}>Toplam: <b>{hours} saat</b></div>
        <button className="btn full" onClick={save}>Kaydet</button>
        {init.id && <button className="btn danger full" onClick={() => { remove('sleep', init.id); onClose() }}>Sil</button>}
      </div>
    </Sheet>
  )
}

function Report({ profile }) {
  const [mode, setMode] = useState('week')
  const [off, setOff] = useState(0)
  const t = useTargets(profile)
  const workouts = useCol('workouts'), food = useCol('food'), sleep = useCol('sleep'), body = useCol('body'), water = useCol('water')
  const range = (o) => {
    if (mode === 'week') {
      const s = addDays(weekStart(today()), -7 * o)
      return [s, addDays(s, 6)]
    }
    const n = new Date()
    const a = new Date(n.getFullYear(), n.getMonth() - o, 1)
    const b = new Date(n.getFullYear(), n.getMonth() - o + 1, 0)
    return [dstr(a), dstr(b)]
  }
  const calc = ([s, e]) => {
    const inR = (x) => x.date >= s && x.date <= e
    const w = workouts.filter(inR)
    const byDay = {}
    food.filter(inR).forEach((f) => (byDay[f.date] = [...(byDay[f.date] || []), f]))
    const days = Object.values(byDay).map(sumMacros)
    const n = days.length || 1
    const sl = sleep.filter(inR)
    const bd = body.filter((b) => inR(b) && b.weight).sort((a, b) => (a.date < b.date ? -1 : 1))
    const wt = water.filter(inR)
    return {
      count: w.length, min: w.reduce((a, x) => a + x.min, 0), burn: w.reduce((a, x) => a + (x.kcal || 0), 0),
      fight: w.filter((x) => TYPES[x.type]?.fight).length, spar: w.filter((x) => x.sparring).length,
      rpe: w.length ? r1(w.reduce((a, x) => a + x.rpe, 0) / w.length) : null,
      foodDays: days.length, kcal: days.length ? r0(days.reduce((a, d) => a + d.kcal, 0) / n) : null, p: days.length ? r0(days.reduce((a, d) => a + d.p, 0) / n) : null,
      pHit: days.filter((d) => d.p >= t.protein * 0.9).length, kHit: days.filter((d) => Math.abs(d.kcal - t.kcal) <= t.kcal * 0.1).length,
      sleep: sl.length ? r1(sl.reduce((a, x) => a + x.hours, 0) / sl.length) : null,
      water: wt.length ? r1(wt.reduce((a, x) => a + x.ml, 0) / wt.length / 1000) : null,
      wDelta: bd.length > 1 ? r1(bd[bd.length - 1].weight - bd[0].weight) : null,
      notes: w.filter((x) => x.improve).map((x) => x.improve),
    }
  }
  const cur = calc(range(off)), prev = calc(range(off + 1))
  const [s, e] = range(off)
  const planned = mode === 'week' ? profile.schedule.filter((x) => x !== 'dinlenme').length : null
  const msgs = []
  if (cur.count === 0 && cur.foodDays === 0) msgs.push('Bu dönemde kayıt yok. Küçük başla: bugün tek bir antrenman ya da tek bir öğün gir.')
  else {
    if (planned && cur.count >= planned) msgs.push(`🏆 Planlanan ${planned} antrenmanın hepsini yaptın. Böyle devam!`)
    else if (planned && cur.count > 0) msgs.push(`💪 ${planned} antrenmandan ${cur.count} tanesini tamamladın${cur.count >= planned - 1 ? ' — neredeyse tam.' : '. Önümüzdeki hafta bir tane fazlasını hedefle.'}`)
    if (cur.p != null && cur.p < t.protein * 0.85) msgs.push(`🥚 Ortalama proteinin ${cur.p} g; hedef ${t.protein} g. Her öğüne bir protein kaynağı ekle (yumurta, yoğurt, tavuk, lor).`)
    else if (cur.p != null) msgs.push(`✅ Protein ortalaman ${cur.p} g — kas kazanımı için yeterli.`)
    if (cur.kcal != null && cur.kcal > t.kcal * 1.1) msgs.push(`🍽️ Ortalama kalorin hedefin ${cur.kcal - t.kcal} kcal üzerinde. Atıştırmalıkları ve içecekleri gözden geçir.`)
    if (cur.kcal != null && cur.kcal < t.kcal * 0.8) msgs.push('⚠️ Hedefin çok altında yiyorsun. Çok düşük kalori kas kaybına ve performans düşüşüne yol açar.')
    if (cur.sleep != null && cur.sleep < profile.sleepGoal - 1) msgs.push(`😴 Uyku ortalaman ${cur.sleep} saat. Toparlanma için ${profile.sleepGoal} saate yaklaşmaya çalış.`)
    if (cur.rpe != null && cur.rpe >= 8.5) msgs.push('🧯 Ortalama zorluk çok yüksek. Arada hafif günler bırak; sürekli tükenmek gelişimi yavaşlatır.')
  }
  const Row = ({ l, v, pv, unit = '' }) => (
    <tr><td>{l}</td><td className="muted">{pv ?? '—'}{pv != null ? unit : ''}</td><td className="b">{v ?? '—'}{v != null ? unit : ''}</td></tr>
  )
  return (
    <>
      <Seg value={mode} onChange={(m) => { setMode(m); setOff(0) }} options={[['week', 'Haftalık'], ['month', 'Aylık']]} />
      <div className="row between mb">
        <button className="iconbtn" onClick={() => setOff(off + 1)} aria-label="Önceki dönem">‹</button>
        <div className="b">{fmtD(s)} – {fmtD(e)}{off === 0 ? (mode === 'week' ? ' · bu hafta' : ' · bu ay') : ''}</div>
        <button className="iconbtn" onClick={() => setOff(Math.max(0, off - 1))} style={{ opacity: off ? 1 : 0.3 }} aria-label="Sonraki dönem">›</button>
      </div>
      <div className="card col" style={{ gap: 8 }}>
        <h3 style={{ margin: 0 }}>Değerlendirme</h3>
        {msgs.map((m, i) => <p key={i}>{m}</p>)}
      </div>
      <div className="card">
        <table className="tbl">
          <thead><tr><th></th><th>Önceki</th><th>Bu dönem</th></tr></thead>
          <tbody>
            <Row l="Antrenman" v={cur.count} pv={prev.count} />
            <Row l="Dövüş dersi" v={cur.fight} pv={prev.fight} />
            <Row l="Sparring" v={cur.spar} pv={prev.spar} />
            <Row l="Toplam süre" v={cur.min} pv={prev.min} unit=" dk" />
            <Row l="Yakılan" v={cur.burn} pv={prev.burn} unit=" kcal" />
            <Row l="Ort. zorluk" v={cur.rpe} pv={prev.rpe} unit="/10" />
            <Row l="Ort. kalori" v={cur.kcal} pv={prev.kcal} unit=" kcal" />
            <Row l="Ort. protein" v={cur.p} pv={prev.p} unit=" g" />
            <Row l="Protein hedefi tutan gün" v={cur.pHit} pv={prev.pHit} />
            <Row l="Kalori hedefi tutan gün" v={cur.kHit} pv={prev.kHit} />
            <Row l="Ort. uyku" v={cur.sleep} pv={prev.sleep} unit=" sa" />
            <Row l="Ort. su" v={cur.water} pv={prev.water} unit=" L" />
            <Row l="Kilo değişimi" v={cur.wDelta} pv={prev.wDelta} unit=" kg" />
          </tbody>
        </table>
      </div>
      {cur.notes.length > 0 && (
        <div className="card">
          <h3>Geliştirilecekler (kendi notların)</h3>
          {cur.notes.map((n, i) => <p key={i} className="small" style={{ padding: '4px 0' }}>• {n}</p>)}
        </div>
      )}
    </>
  )
}

function Badges({ profile }) {
  const { badges, level, streak } = useStats(profile)
  return (
    <>
      <div className="card row between">
        <div><div className="muted tiny">SEVİYE {level.n}</div><div className="b" style={{ fontSize: 20 }}>{level.name}</div></div>
        <div className="row" style={{ gap: 8 }}><span className="chip accent">🔥 {streak} gün</span><span className="chip">{level.xp} XP</span></div>
      </div>
      <div className="card">
        {badges.map(([ic, name, desc, ok]) => (
          <div className="li" key={name} style={{ opacity: ok ? 1 : 0.45 }}>
            <div className="emo" style={{ filter: ok ? 'none' : 'grayscale(1)' }}>{ic}</div>
            <div className="grow"><div className="t">{name}</div><div className="muted small">{desc}</div></div>
            {ok && <span className="chip good">✓ kazanıldı</span>}
          </div>
        ))}
      </div>
    </>
  )
}
