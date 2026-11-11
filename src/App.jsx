import { useState } from 'react'
import { useProfile } from './hooks'
import { Toast } from './ui'
import Today from './pages/Today'
import Training from './pages/Training'
import Nutrition from './pages/Nutrition'
import Progress from './pages/Progress'
import Learn from './pages/Learn'
import Settings from './pages/Settings'
import Welcome from './pages/Welcome'
import { WorkoutForm } from './pages/Training'

const TABS = [
  ['today', 'Bugün', '🏠'],
  ['train', 'Antrenman', '🥊'],
  ['food', 'Beslenme', '🍽️'],
  ['progress', 'Gelişim', '📈'],
  ['learn', 'Öğren', '🎓'],
]

export default function App() {
  const profile = useProfile()
  const [tab, setTab] = useState('today')
  const [settings, setSettings] = useState(false)
  const [workout, setWorkout] = useState(null) // { type?, date?, edit? }
  if (!profile) return (<><Welcome /><Toast /></>)
  const nav = { go: setTab, openSettings: () => setSettings(true), logWorkout: (init = {}) => setWorkout(init) }
  const Page = { today: Today, train: Training, food: Nutrition, progress: Progress, learn: Learn }[tab]
  return (
    <>
      <div className="app">
        <Page profile={profile} nav={nav} />
      </div>
      <nav className="tabs">
        <div className="inner">
          {TABS.map(([k, label, ic]) => (
            <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); window.scrollTo(0, 0) }}>
              <span className="ic">{ic}</span>
              {label}
            </button>
          ))}
        </div>
      </nav>
      {settings && <Settings profile={profile} onClose={() => setSettings(false)} />}
      {workout && <WorkoutForm profile={profile} init={workout} onClose={() => setWorkout(null)} />}
      <Toast />
    </>
  )
}
