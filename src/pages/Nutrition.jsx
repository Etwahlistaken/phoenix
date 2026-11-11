import { useMemo, useState } from 'react'
import { useCol, put, remove } from '../store'
import { useTargets } from '../hooks'
import { today, sumMacros, r0, r1, fmtLong } from '../calc'
import { FOODS, searchFoods, macrosFor, MEALS, MEAL_PLANS, foodByName } from '../data/foods'
import { Sheet, Seg, Field, Num, toNum, Ring, MacroBar, DateNav, toast } from '../ui'

export default function Nutrition({ profile }) {
  const [date, setDate] = useState(today())
  const [view, setView] = useState('log')
  const [adding, setAdding] = useState(null) // meal key
  const [editing, setEditing] = useState(null)
  const t = useTargets(profile)
  const all = useCol('food')
  const items = useMemo(() => all.filter((f) => f.date === date).sort((a, b) => a.ts - b.ts), [all, date])
  const m = sumMacros(items)
  return (
    <>
      <div className="hdr">
        <div>
          <div className="sub">Hedef {t.kcal} kcal · {t.protein} g protein</div>
          <h1>Beslenme</h1>
        </div>
      </div>
      <Seg value={view} onChange={setView} options={[['log', 'Günlük'], ['plans', 'Öğün planları'], ['guide', 'Rehber']]} />

      {view === 'log' && (
        <>
          <DateNav date={date} onChange={setDate} today={today()} fmt={fmtLong} />
          <div className="card">
            <div className="row" style={{ gap: 16 }}>
              <Ring value={m.kcal} max={t.kcal} color={m.kcal > t.kcal * 1.05 ? 'var(--bad)' : 'var(--accent)'}>
                <div className="big" style={{ fontSize: 24 }}>{r0(m.kcal)}</div>
                <div className="muted tiny">/ {t.kcal} kcal</div>
              </Ring>
              <div className="grow col" style={{ gap: 12 }}>
                <MacroBar label="Protein" value={m.p} max={t.protein} color="var(--c1)" />
                <MacroBar label="Karbonhidrat" value={m.c} max={t.carbs} color="var(--c2)" />
                <MacroBar label="Yağ" value={m.f} max={t.fat} color="var(--c3)" />
              </div>
            </div>
          </div>
          {MEALS.map(([key, label]) => {
            const list = items.filter((i) => i.meal === key)
            const mm = sumMacros(list)
            return (
              <div className="card" key={key}>
                <div className="row between">
                  <div>
                    <div className="b" style={{ fontSize: 16 }}>{label}</div>
                    <div className="muted small num">{r0(mm.kcal)} kcal · P {r0(mm.p)} · K {r0(mm.c)} · Y {r0(mm.f)}</div>
                  </div>
                  <button className="btn sm" onClick={() => setAdding(key)} aria-label={`${label} öğününe ekle`}>+ Ekle</button>
                </div>
                {list.length > 0 && <div style={{ marginTop: 8 }}>
                  {list.map((i) => (
                    <button className="li" key={i.id} onClick={() => setEditing(i)}>
                      <div className="grow">
                        <div className="t">{i.name}</div>
                        <div className="muted small num">{r0(i.grams)} g · P {r1(i.p)} · K {r1(i.c)} · Y {r1(i.f)}</div>
                      </div>
                      <div className="b num">{r0(i.kcal)}</div>
                    </button>
                  ))}
                </div>}
              </div>
            )
          })}
        </>
      )}

      {view === 'plans' && <Plans t={t} date={date} onAdded={() => setView('log')} />}
      {view === 'guide' && <Guide t={t} profile={profile} />}

      {adding && <AddFood meal={adding} date={date} onClose={() => setAdding(null)} />}
      {editing && <Amount item={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function AddFood({ meal, date, onClose }) {
  const [q, setQ] = useState('')
  const [pick, setPick] = useState(null)
  const [custom, setCustom] = useState(false)
  const customFoods = useCol('customFoods')
  const log = useCol('food')
  const recent = useMemo(() => {
    const seen = new Map()
    ;[...log].sort((a, b) => b.ts - a.ts).forEach((i) => !seen.has(i.name) && seen.set(i.name, i))
    return [...seen.values()].slice(0, 8)
  }, [log])
  const results = useMemo(() => searchFoods(q, customFoods).slice(0, 60), [q, customFoods])
  const findFood = (name) => customFoods.find((f) => f.name === name) || foodByName(name)
  if (custom) return <CustomFood onClose={() => setCustom(false)} onSaved={(f) => { setCustom(false); setPick({ food: f }) }} initName={q} />
  if (pick) return <Amount food={pick.food} initGrams={pick.grams} meal={meal} date={date} onClose={() => setPick(null)} onDone={() => { setPick(null); setQ('') }} />
  return (
    <Sheet title={`${MEALS.find((m) => m[0] === meal)[1]} — besin ekle`} onClose={onClose}>
      <input className="in mb" placeholder="Besin ara (ör. tavuk, yoğurt, pilav)" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
      {!q && recent.length > 0 && (
        <div className="card">
          <h3>Son eklenenler</h3>
          {recent.map((i) => {
            const food = findFood(i.name)
            return food ? (
              <button className="li" key={i.id} onClick={() => setPick({ food, grams: i.grams })}>
                <div className="grow"><div className="t">{i.name}</div><div className="muted small">{r0(i.grams)} g · {r0(i.kcal)} kcal</div></div>
                <span className="muted">＋</span>
              </button>
            ) : null
          })}
        </div>
      )}
      <div className="card">
        <h3>{q ? 'Sonuçlar' : 'Tüm besinler'} <span className="muted" style={{ textTransform: 'none', letterSpacing: 0 }}>(100 g için)</span></h3>
        {results.map((f) => (
          <button className="li" key={f.id} onClick={() => setPick({ food: f })}>
            <div className="grow">
              <div className="t">{f.name}{f.custom ? ' ★' : ''}</div>
              <div className="muted small num">{f.kcal} kcal · P {f.p} · K {f.c} · Y {f.f}</div>
            </div>
            <span className="muted">＋</span>
          </button>
        ))}
        {results.length === 0 && <div className="empty">Bulunamadı. Aşağıdan kendi besinini ekleyebilirsin.</div>}
      </div>
      <button className="btn ghost full" onClick={() => setCustom(true)}>+ Kendi besinimi tanımla</button>
    </Sheet>
  )
}

// Miktar seçimi: yeni ekleme (food) veya var olan kaydı düzenleme (item)
function Amount({ food, item, initGrams, meal, date, onClose, onDone }) {
  const customFoods = useCol('customFoods')
  const base = food || customFoods.find((f) => f.name === item.name) || foodByName(item.name) || { name: item.name, kcal: (item.kcal / item.grams) * 100, p: (item.p / item.grams) * 100, c: (item.c / item.grams) * 100, f: (item.f / item.grams) * 100, portions: [] }
  const units = [...(base.portions || []), ['gram', 1]]
  const startG = item?.grams ?? initGrams
  const [unit, setUnit] = useState(startG ? units.length - 1 : 0)
  const [count, setCount] = useState(String(startG ? r0(startG) : units[0][1] === 1 ? 100 : 1))
  const grams = (toNum(count) || 0) * units[unit][1]
  const m = macrosFor(base, grams)
  const save = () => {
    if (!grams) return toast('Miktar gir')
    const rec = { name: base.name, grams, kcal: r1(m.kcal), p: r1(m.p), c: r1(m.c), f: r1(m.f) }
    if (item) put('food', { ...item, ...rec })
    else put('food', { ...rec, date, meal })
    toast(item ? 'Güncellendi' : `${base.name} eklendi`)
    ;(onDone || onClose)()
  }
  return (
    <Sheet title={base.name} onClose={onClose}>
      <div className="col">
        <div className="row">
          <Field label="Miktar"><Num value={count} onChange={setCount} autoFocus /></Field>
          <Field label="Birim">
            <select className="in" value={unit} onChange={(e) => { const u = +e.target.value; setUnit(u); setCount(units[u][1] === 1 ? String(r0(grams) || 100) : '1') }}>
              {units.map(([n, g], i) => <option key={i} value={i}>{n}{g !== 1 ? ` (${g} g)` : ''}</option>)}
            </select>
          </Field>
        </div>
        <div className="card" style={{ margin: 0 }}>
          <div className="row between">
            <div><div className="big">{r0(m.kcal)}</div><div className="muted small">kcal · {r0(grams)} g</div></div>
            <div className="center"><div className="b num">{r1(m.p)} g</div><div className="muted tiny">protein</div></div>
            <div className="center"><div className="b num">{r1(m.c)} g</div><div className="muted tiny">karb.</div></div>
            <div className="center"><div className="b num">{r1(m.f)} g</div><div className="muted tiny">yağ</div></div>
          </div>
        </div>
        <button className="btn full" onClick={save}>{item ? 'Güncelle' : 'Ekle'}</button>
        {item && <button className="btn danger full" onClick={() => { remove('food', item.id); onClose() }}>Sil</button>}
      </div>
    </Sheet>
  )
}

function CustomFood({ onClose, onSaved, initName }) {
  const [f, setF] = useState({ name: initName || '', kcal: '', p: '', c: '', f: '', portion: '' })
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const save = () => {
    if (!f.name.trim() || toNum(f.kcal) == null) return toast('Ad ve kalori gerekli')
    const g = toNum(f.portion)
    const rec = put('customFoods', { name: f.name.trim(), kcal: toNum(f.kcal), p: toNum(f.p) || 0, c: toNum(f.c) || 0, f: toNum(f.f) || 0, portions: g ? [['porsiyon', g]] : [], custom: true })
    onSaved(rec)
  }
  return (
    <Sheet title="Kendi besinim" onClose={onClose}>
      <div className="col">
        <p className="muted small">Paketin arkasındaki "100 g için" değerlerini gir.</p>
        <Field label="Ad"><input className="in" value={f.name} onChange={(e) => set('name')(e.target.value)} /></Field>
        <div className="row">
          <Field label="Kalori (kcal)"><Num value={f.kcal} onChange={set('kcal')} /></Field>
          <Field label="Protein (g)"><Num value={f.p} onChange={set('p')} /></Field>
        </div>
        <div className="row">
          <Field label="Karbonhidrat (g)"><Num value={f.c} onChange={set('c')} /></Field>
          <Field label="Yağ (g)"><Num value={f.f} onChange={set('f')} /></Field>
        </div>
        <Field label="1 porsiyon kaç gram? (isteğe bağlı)"><Num value={f.portion} onChange={set('portion')} /></Field>
        <button className="btn full" onClick={save}>Kaydet ve devam et</button>
      </div>
    </Sheet>
  )
}

function Plans({ t, date, onAdded }) {
  return (
    <>
      <p className="muted small mb">Gramlar günlük {t.kcal} kcal hedefine göre otomatik ölçeklendi. Beğendiğin günü tek dokunuşla günlüğüne ekleyip sonra düzenleyebilirsin.</p>
      {MEAL_PLANS.map((plan) => {
        const raw = Object.values(plan.meals).flat().map(([n, g]) => macrosFor(foodByName(n), g))
        const k = t.kcal / sumMacros(raw).kcal
        const scaled = Object.fromEntries(Object.entries(plan.meals).map(([meal, list]) => [meal, list.map(([n, g]) => {
          const grams = Math.max(5, Math.round((g * k) / 5) * 5)
          return { name: n, grams, ...macrosFor(foodByName(n), grams) }
        })]))
        const tot = sumMacros(Object.values(scaled).flat())
        const add = () => {
          for (const [meal, list] of Object.entries(scaled)) for (const i of list) put('food', { date, meal, name: i.name, grams: i.grams, kcal: r1(i.kcal), p: r1(i.p), c: r1(i.c), f: r1(i.f) })
          toast('Plan günlüğe eklendi')
          onAdded()
        }
        return (
          <details className="card" key={plan.name}>
            <summary>
              <div className="row between">
                <div className="b" style={{ fontSize: 16 }}>{plan.name}</div>
                <span className="muted">▾</span>
              </div>
              <div className="muted small" style={{ margin: '4px 0 8px' }}>{plan.note}</div>
              <div className="row wrap" style={{ gap: 6 }}>
                <span className="chip">{r0(tot.kcal)} kcal</span>
                <span className="chip">P {r0(tot.p)} g</span>
                <span className="chip">K {r0(tot.c)} g</span>
                <span className="chip">Y {r0(tot.f)} g</span>
              </div>
            </summary>
            {MEALS.map(([key, label]) => (
              <div key={key} style={{ marginTop: 12 }}>
                <div className="row between"><span className="b">{label}</span><span className="muted small num">{r0(sumMacros(scaled[key]).kcal)} kcal · P {r0(sumMacros(scaled[key]).p)} g</span></div>
                {scaled[key].map((i) => <div key={i.name} className="row between small" style={{ padding: '3px 0' }}><span>{i.name}</span><span className="muted num">{i.grams} g</span></div>)}
              </div>
            ))}
            <button className="btn full" style={{ marginTop: 14 }} onClick={add}>Bu günü günlüğüme ekle</button>
          </details>
        )
      })}
    </>
  )
}

function Guide({ t, profile }) {
  const S = ({ title, children }) => <div className="card"><div className="b" style={{ fontSize: 16, marginBottom: 6 }}>{title}</div><div className="small col" style={{ gap: 6 }}>{children}</div></div>
  return (
    <>
      <S title="Senin planın nasıl hesaplandı?">
        <p>Bazal metabolizman <b>{t.bmr} kcal</b>, antrenmanlarla birlikte günlük harcaman yaklaşık <b>{t.tdee} kcal</b>. Hedefin için <b>{t.kcal} kcal</b> belirlendi.</p>
        <p>Yeni başlayan biri hafif bir kalori açığında, yüksek proteinle hem yağ yakıp hem kas kazanabilir. Tartı birkaç kilo düşebilir; bu yağ kaybıdır, kas ölçülerin ve kuvvetin artıyorsa doğru yoldasın.</p>
      </S>
      <S title={`Protein: günde ${t.protein} g`}>
        <p>Kilo başına {profile.proteinPerKg} g. 3-4 öğüne böl, her öğünde 30-45 g hedefle.</p>
        <p>Ucuz ve kolay kaynaklar: yumurta, tavuk göğsü/but, yoğurt, lor, çökelek, kuru baklagiller, konserve ton, kıyma. Protein tozu sadece eksiği kapatmak için — günde 1 ölçek yeterli.</p>
      </S>
      <S title="Antrenman çevresinde beslenme">
        <p><b>2-3 saat önce:</b> karbonhidrat + protein (pilav/bulgur/makarna + tavuk, yulaf + süt).</p>
        <p><b>30-60 dk önce (acıktıysan):</b> muz, hurma ya da bir dilim ekmek + bal.</p>
        <p><b>Sonrasında 1-2 saat içinde:</b> 30-40 g protein + karbonhidrat.</p>
      </S>
      <S title="Faydasız atıştırmalıkları değiştir">
        <p>Cips → bir avuç kuruyemiş + meyve · Çikolata → süzme yoğurt + bal + ceviz · Kola → maden suyu / ayran · Bisküvi → tam buğday ekmeği + fıstık ezmesi.</p>
        <p>Evde bulundurmamak en etkili yöntemdir. Haftada 1-2 keyif öğünü planı bozmaz; günlüğe yazmayı unutma.</p>
      </S>
      <S title="Tabak kuralı">
        <p>Tabağın yarısı sebze/salata, çeyreği protein, çeyreği tahıl. Yemeklerde yağı kaşıkla ölç: 1 yemek kaşığı zeytinyağı ≈ 90 kcal.</p>
      </S>
      <p className="muted tiny center">Besin değerleri yaklaşık ortalamalardır. Bir sağlık sorunun varsa beslenme planını bir diyetisyenle gözden geçir.</p>
    </>
  )
}
