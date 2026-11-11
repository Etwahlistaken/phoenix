import { useState } from 'react'
import { saveProfile } from '../hooks'
import { targets, GOALS, TYPES, DAYS, today } from '../calc'
import { exportJSON, importJSON, wipeAll } from '../store'
import { useSync, saveConfig, clearConfig, signIn, signUp, signOut, syncNow, getConfig } from '../sync'
import { Sheet, Field, Num, toNum, toast } from '../ui'

const SCHED = ['boks', 'kickboks', 'mma', 'kuvvetA', 'kuvvetB', 'kondisyon', 'torba', 'kosu', 'ip', 'yuruyus', 'mobilite', 'dinlenme']

async function saveFile(name, text, type) {
  const file = new File([text], name, { type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch (e) {
      if (e.name === 'AbortError') return
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(file)
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 5000)
}

function buildICS(p, r) {
  const BY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  const d0 = today().replace(/-/g, '')
  const hm = (t) => t.replace(':', '') + '00'
  const ev = (uid, title, time, rrule) =>
    ['BEGIN:VEVENT', `UID:kose-${uid}@kose.app`, `DTSTAMP:${d0}T000000Z`, `DTSTART:${d0}T${hm(time)}`, 'DURATION:PT5M', `RRULE:${rrule}`, `SUMMARY:${title}`, 'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${title}`, 'TRIGGER:PT0M', 'END:VALARM', 'END:VEVENT'].join('\r\n')
  const out = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Kose//TR', 'CALSCALE:GREGORIAN']
  if (r.weigh) out.push(ev('tarti', '⚖️ Tartı ve ölçüm günü (Köşe)', '08:00', `FREQ=WEEKLY;BYDAY=${BY[p.weighDay]}`))
  if (r.sleep) {
    const [h, m] = p.bedtime.split(':').map(Number)
    const t = (h * 60 + m - 30 + 1440) % 1440
    out.push(ev('uyku', '😴 Yatmaya hazırlan: ekranı bırak (Köşe)', `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, 'FREQ=DAILY'))
  }
  if (r.water) ['11:00', '15:00', '18:30'].forEach((t, i) => out.push(ev('su' + i, '💧 Su iç (Köşe)', t, 'FREQ=DAILY')))
  if (r.food) out.push(ev('ogun', '🍽️ Bugünkü öğünlerini gir (Köşe)', '21:00', 'FREQ=DAILY'))
  if (r.train) {
    const days = p.schedule.map((s, i) => (s !== 'dinlenme' ? BY[i] : null)).filter(Boolean)
    if (days.length) out.push(ev('antrenman', '🥊 Antrenman günü — çantanı hazırla (Köşe)', '09:00', `FREQ=WEEKLY;BYDAY=${days.join(',')}`))
  }
  out.push('END:VCALENDAR')
  return out.join('\r\n')
}

export default function Settings({ profile, onClose }) {
  const [f, setF] = useState({ ...profile })
  const [rem, setRem] = useState({ weigh: true, sleep: true, water: true, food: true, train: true })
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }))
  const p = { ...f, age: toNum(f.age) || profile.age, height: toNum(f.height) || profile.height, weight: toNum(f.weight) || profile.weight, waterGoal: toNum(f.waterGoal) || 3000, sleepGoal: toNum(f.sleepGoal) || 8, proteinPerKg: toNum(f.proteinPerKg) || 2 }
  const t = targets(p)
  const save = () => {
    saveProfile(p)
    toast('Ayarlar kaydedildi')
    onClose()
  }
  const doImport = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!window.confirm('Bu cihazdaki tüm veriler yedekteki verilerle değiştirilecek. Devam edilsin mi?')) return
    try {
      importJSON(await file.text())
      toast('Yedek yüklendi')
      onClose()
    } catch (err) {
      toast(err.message)
    }
  }
  return (
    <Sheet title="Ayarlar" onClose={onClose}>
      <div className="card col">
        <h3 style={{ margin: 0 }}>Profil</h3>
        <Field label="Ad"><input className="in" value={f.name} onChange={(e) => set('name')(e.target.value)} /></Field>
        <div className="row">
          <Field label="Yaş"><Num value={f.age} onChange={set('age')} /></Field>
          <Field label="Boy (cm)"><Num value={f.height} onChange={set('height')} /></Field>
          <Field label="Kilo (kg)"><Num value={f.weight} onChange={set('weight')} /></Field>
        </div>
        <div className="row">
          <Field label="Cinsiyet">
            <select className="in" value={f.sex} onChange={(e) => set('sex')(e.target.value)}><option value="m">Erkek</option><option value="f">Kadın</option></select>
          </Field>
          <Field label="Program başlangıcı"><input className="in" type="date" value={f.startDate || today()} onChange={(e) => set('startDate')(e.target.value)} /></Field>
        </div>
      </div>

      <div className="card col">
        <h3 style={{ margin: 0 }}>Hedef ve beslenme</h3>
        <div className="row">
          <Field label="Hedef">
            <select className="in" value={f.goal} onChange={(e) => set('goal')(e.target.value)}>{Object.entries(GOALS).map(([k, g]) => <option key={k} value={k}>{g.name}</option>)}</select>
          </Field>
          <Field label="Protein (g/kg)"><Num value={f.proteinPerKg} onChange={set('proteinPerKg')} /></Field>
        </div>
        <div className="notice" style={{ margin: 0 }}>
          Günlük: <b>{t.kcal} kcal</b> · P {t.protein} g · K {t.carbs} g · Y {t.fat} g
          <div className="muted small">Tahmini günlük harcama {t.tdee} kcal (bazal {t.bmr})</div>
        </div>
        <div className="row">
          <Field label="Su hedefi (ml)"><Num value={f.waterGoal} onChange={set('waterGoal')} /></Field>
          <Field label="Uyku hedefi (sa)"><Num value={f.sleepGoal} onChange={set('sleepGoal')} /></Field>
          <Field label="Yatış saati"><input className="in" type="time" value={f.bedtime} onChange={(e) => set('bedtime')(e.target.value)} /></Field>
        </div>
      </div>

      <div className="card col">
        <h3 style={{ margin: 0 }}>Haftalık program</h3>
        {DAYS.map((d, i) => (
          <div className="row" key={d}>
            <span style={{ width: 92 }}>{d}</span>
            <select className="in" aria-label={d} value={f.schedule[i]} onChange={(e) => set('schedule')(f.schedule.map((s, j) => (j === i ? e.target.value : s)))}>
              {SCHED.map((k) => <option key={k} value={k}>{TYPES[k].icon} {TYPES[k].name}</option>)}
            </select>
          </div>
        ))}
        <Field label="Tartı / ölçüm günü">
          <select className="in" value={f.weighDay} onChange={(e) => set('weighDay')(+e.target.value)}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
        </Field>
      </div>
      <button className="btn full mb" onClick={save}>Ayarları kaydet</button>

      <div className="card col">
        <h3 style={{ margin: 0 }}>Hatırlatmalar</h3>
        <p className="muted small">iPhone'da web uygulamaları kapalıyken bildirim gönderemez. Bunun yerine hatırlatmaları telefonunun Takvim uygulamasına ekleyebilirsin; alarmlar oradan çalar.</p>
        {[['train', 'Antrenman günleri (09:00)'], ['weigh', `Haftalık tartı (${DAYS[p.weighDay]} 08:00)`], ['water', 'Su (11:00, 15:00, 18:30)'], ['food', 'Öğün kaydı (21:00)'], ['sleep', `Yatış hazırlığı (${p.bedtime} öncesi 30 dk)`]].map(([k, l]) => (
          <label className="row" key={k} style={{ minHeight: 36 }}>
            <input type="checkbox" checked={rem[k]} onChange={(e) => setRem((r) => ({ ...r, [k]: e.target.checked }))} style={{ width: 22, height: 22, accentColor: 'var(--accent)' }} />
            <span>{l}</span>
          </label>
        ))}
        <button className="btn ghost full" onClick={() => saveFile('kose-hatirlatmalar.ics', buildICS(p, rem), 'text/calendar')}>Takvime ekle (.ics)</button>
      </div>

      <SyncPanel />

      <div className="card col">
        <h3 style={{ margin: 0 }}>Yedekleme</h3>
        <button className="btn ghost full" onClick={() => saveFile(`kose-yedek-${today()}.json`, exportJSON(), 'application/json')}>Verilerimi dosyaya aktar</button>
        <label className="btn ghost full">
          Yedekten geri yükle
          <input type="file" accept="application/json,.json" onChange={doImport} style={{ display: 'none' }} />
        </label>
        <button className="btn danger full" onClick={() => { if (window.confirm('Bu cihazdaki TÜM veriler silinecek. Emin misin?') && window.confirm('Son kez: bu işlem geri alınamaz. Silinsin mi?')) { wipeAll(); onClose() } }}>Bu cihazdaki verileri sil</button>
      </div>
      <p className="muted tiny center">Köşe v1.0 · Veriler önce bu cihazda saklanır; giriş yaptıysan buluta eşitlenir.</p>
    </Sheet>
  )
}

export function SyncPanel() {
  const s = useSync()
  const cfg = getConfig()
  const [url, setUrl] = useState(cfg?.url || '')
  const [key, setKey] = useState(cfg?.key || '')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const run = async (fn) => {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fn()
      if (r === 'confirm') setMsg('E-postana bir onay bağlantısı gönderildi. Onayladıktan sonra giriş yap.')
    } catch (e) {
      setMsg(e.message)
    }
    setBusy(false)
  }
  return (
    <div className="card col">
      <h3 style={{ margin: 0 }}>Bulut eşitleme</h3>
      {!s.configured ? (
        <>
          <p className="muted small">Telefon ve bilgisayar arasında eşitleme için ücretsiz Supabase projenin adresini ve "anon public" anahtarını bir kez gir (Supabase › Project Settings › API).</p>
          <Field label="Project URL"><input className="in" placeholder="https://xxxx.supabase.co" value={url} onChange={(e) => setUrl(e.target.value)} autoCapitalize="none" autoCorrect="off" /></Field>
          <Field label="Anon public key"><input className="in" value={key} onChange={(e) => setKey(e.target.value)} autoCapitalize="none" autoCorrect="off" /></Field>
          <button className="btn ghost full" onClick={() => run(async () => saveConfig(url, key))}>Bağlan</button>
        </>
      ) : !s.user ? (
        <>
          <p className="muted small">Bağlantı kuruldu. Hesabınla giriş yap; ilk kez kullanıyorsan "Hesap oluştur"a bas.</p>
          <Field label="E-posta"><input className="in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoCapitalize="none" /></Field>
          <Field label="Şifre"><input className="in" type="password" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
          <div className="row">
            <button className="btn grow" disabled={busy} onClick={() => run(() => signIn(email, pw))}>Giriş yap</button>
            <button className="btn ghost grow" disabled={busy} onClick={() => run(() => signUp(email, pw))}>Hesap oluştur</button>
          </div>
          <button className="muted small" onClick={clearConfig}>Bağlantı bilgilerini değiştir</button>
        </>
      ) : (
        <>
          <div className="row between">
            <div className="grow">
              <div className="b" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.user.email}</div>
              <div className="muted small">
                {s.state === 'syncing' ? 'Eşitleniyor…' : s.state === 'error' ? `Hata: ${s.error}` : s.lastSync ? `Son eşitleme: ${new Date(s.lastSync).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}` : 'Hazır'}
              </div>
            </div>
            <span className={`chip ${s.state === 'error' ? '' : 'good'}`}>{s.state === 'error' ? '⚠️' : '☁️ açık'}</span>
          </div>
          <div className="row">
            <button className="btn ghost grow" onClick={syncNow}>Şimdi eşitle</button>
            <button className="btn ghost grow" onClick={() => run(signOut)}>Çıkış yap</button>
          </div>
        </>
      )}
      {msg && <div className="notice" style={{ margin: 0 }}>{msg}</div>}
      {s.error && !s.user && <div className="notice" style={{ margin: 0 }}>{s.error}</div>}
    </div>
  )
}
