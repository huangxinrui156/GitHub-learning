import { StrictMode, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import './style.css'

const chapters = [
  { id: 'pressure', no: '00', name: '序章 · 水压', en: 'PRESSURE', depth: '0', title: '海渊回响', english: 'Abyssal Echoes', lines: ['沿着水压的梯度下沉，', '在光线消逝的地方，倾听海的记忆。'], specimen: '幽灵水母', latin: 'PHANTOM JELLY', image: 'jelly', params: [['记录海域', '远洋中层水域'], ['识别特征', '半透明伞体 / 飘带状触手'], ['观测方式', '低照度影像']], note: '伞缘的细纹随水流舒展。近景保留了伞体与触手交接处的纹理。' },
  { id: 'beacon', no: '01', name: '第一章 · 海沟信标', en: 'TRENCH BEACON', depth: '−1200', title: '海沟信标', english: 'Trench Beacon', lines: ['日光已经退去，信标仍在海底闪烁。', '每隔十二秒，黑暗便归还一次回声。'], specimen: '声呐信标', latin: 'SONAR BEACON', image: 'beacon', params: [['记录深度', '1,200 m'], ['脉冲间隔', '12 s'], ['状态', '间歇发射']], note: '琥珀色指示灯标记发射周期。壳体上的沉积物记录了信标留在海底的时间。' },
  { id: 'memory', no: '02', name: '第二章 · 潮汐记忆', en: 'TIDAL MEMORY', depth: '−4500', title: '潮汐记忆', english: 'Tidal Memory', lines: ['潮汐的痕迹留在一枚空壳里。', '洋流穿过它，把更早的海带入此刻。'], specimen: '鹦鹉螺空壳', latin: 'NAUTILUS SHELL', image: 'shell', params: [['采集深度', '4,500 m'], ['结构', '螺旋状分室'], ['保存状态', '空壳 / 局部磨蚀']], note: '分室沿螺旋逐渐增大，近景中可见被水流磨钝的外缘。' },
  { id: 'surface', no: '03', name: '尾声 · 浮出水面', en: 'RESURFACING', depth: '−8000', title: '浮出水面', english: 'Resurfacing', lines: ['在八千米处，潜航记录写下最后一笔。', '转身向上，等水面重新接住光。'], specimen: '上浮影像', latin: 'SURFACE LIGHT', image: 'surface', params: [['上浮起点', '8,000 m'], ['观测方向', '向上'], ['记录对象', '水面折射']], note: '水面波纹会不断改变入射光的方向。近景记录了光束在水体中的散射。' },
]
type Chapter = typeof chapters[number]
const asset = (chapter: Chapter) => `${import.meta.env.BASE_URL}${chapter.image}.webp`

function Icon({ name }: { name: 'logo' | 'sound' | 'mute' | 'arrow' | 'down' | 'close' }) {
  const paths = {
    logo: <><path d="m12 2 9 5v10l-9 5-9-5V7z"/><path d="M7 13c2.5-1.8 3.7 1.8 6.2 0l3.8-2.5M7 16c2.5-1.8 3.7 1.8 6.2 0l3.8-2.5"/></>,
    sound: <path d="M3 12h3m3-4v8m3-12v16m3-12v8m3-6v4m3-2h1"/>,
    mute: <><path d="M3 12h3m3-4v8m3-12v16m3-12v8m3-6v4m3-2h1"/><path d="m4 20 16-16" strokeWidth="1.5"/></>,
    arrow: <path d="M5 19 19 5M8 5h11v11"/>,
    down: <path d="M12 4v15m-5-5 5 5 5-5"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function useResonance(depth: number) {
  const engine = useRef<{ context: AudioContext; gain: GainNode; tone: OscillatorNode } | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [failed, setFailed] = useState(false)
  const busy = useRef(false)
  useEffect(() => {
    const audio = engine.current
    if (audio) audio.tone.frequency.setTargetAtTime(58 - depth * 5, audio.context.currentTime, 0.7)
  }, [depth])
  useEffect(() => () => { void engine.current?.context.close(); engine.current = null }, [])
  async function toggle() {
    if (busy.current) return
    busy.current = true
    try {
      if (!engine.current) {
        const context = new AudioContext()
        const gain = context.createGain()
        gain.gain.value = 0
        gain.connect(context.destination)
        const tone = context.createOscillator()
        tone.type = 'sine'
        tone.frequency.value = 58 - depth * 5
        tone.connect(gain)
        const overtone = context.createOscillator()
        overtone.frequency.value = 119
        const overtoneGain = context.createGain()
        overtoneGain.gain.value = 0.12
        overtone.connect(overtoneGain).connect(gain)
        const pulse = context.createOscillator()
        pulse.frequency.value = 0.19
        const pulseDepth = context.createGain()
        pulse.connect(pulseDepth).connect(overtoneGain.gain)
        pulseDepth.gain.value = 0.08
        for (const oscillator of [tone, overtone, pulse]) oscillator.start()
        engine.current = { context, gain, tone }
      }
      const { context, gain } = engine.current
      if (!enabled) await context.resume()
      gain.gain.setTargetAtTime(enabled ? 0 : 0.105, context.currentTime, 0.2)
      setEnabled(!enabled)
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      busy.current = false
    }
  }
  return { enabled, failed, toggle }
}

function App() {
  const [active, setActive] = useState(0)
  const [inspection, setInspection] = useState<Chapter | null>(null)
  const [view, setView] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null)
  const sections = useRef<(HTMLElement | null)[]>([])
  const audio = useResonance(active)

  useEffect(() => {
    let frame = 0
    function update() {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const current = sections.current.findLastIndex(section => section && section.getBoundingClientRect().top <= window.innerHeight * 0.48)
        setActive(Math.max(current, 0))
      })
    }
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  useEffect(() => {
    if (inspection) dialog.current?.showModal()
  }, [inspection])

  return <>
    <header className="header">
      <a className="identity" href="#pressure"><Icon name="logo"/><span>深海档案<small>ABYSSAL ARCHIVE</small></span></a>
      <span className="header-note">海洋观测记录 <i/> OCEANIC FIELD LOG</span>
      <button className="audio" type="button" aria-label="深海环境音" aria-pressed={audio.enabled} onClick={audio.toggle}>
        <Icon name={audio.enabled ? 'sound' : 'mute'}/><span>{audio.enabled ? '声场开启' : '声场静音'}</span>
      </button>
      {audio.failed && <span className="audio-error" role="status">声场暂时无法开启</span>}
    </header>

    <main>
      {chapters.map((chapter, index) => <section key={chapter.id} id={chapter.id} ref={element => { sections.current[index] = element }} className={`chapter chapter-${index}${active === index ? ' is-active' : ''}`} aria-labelledby={`title-${chapter.id}`}>
        <div className="scene" aria-hidden="true">
          <img src={asset(chapter)} alt="" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'}/>
          <div className="wash"/>
          <div className="particles"/>
          <div className="sonar"><i/><i/><i/><i/></div>
          <div className="reticle">+</div>
        </div>
        <div className="chapter-inner">
          <div className="chapter-copy">
            <div className="eyebrow"><span>{chapter.no} / {chapter.en}</span><i/><span>{chapter.name}</span></div>
            {index === 0 ? <h1 id={`title-${chapter.id}`}>{chapter.title}</h1> : <h2 id={`title-${chapter.id}`}>{chapter.title}</h2>}
            <p className="subtitle" lang="en">{chapter.english}</p>
            <div className="copy-rule"/>
            <p className="description">{chapter.lines[0]}<br/>{chapter.lines[1]}</p>
            <a className="dive" href={`#${chapters[index + 1]?.id ?? chapters[0].id}`}><Icon name="down"/>{index === 0 ? '开始下潜' : index === 3 ? '返回水面记录' : '继续潜航'}</a>
          </div>
          <button className="specimen" type="button" aria-haspopup="dialog" onClick={() => { setView(0); setInspection(chapter) }}>
            <span className="specimen-image"><img src={asset(chapter)} alt="" loading="lazy"/></span>
            <span className="specimen-text"><small>档案 / AE–0{index + 1}</small><strong>{chapter.specimen}</strong><span>{chapter.latin}</span></span>
            <Icon name="arrow"/>
          </button>
        </div>
        <div className="chapter-footer"><span><i/> {index === 3 ? '观测结束' : '观测记录中'}</span><span>AE / EXPEDITION 01</span><span>{chapter.no} / 03</span></div>
      </section>)}
    </main>

    <nav className="depth" aria-label="深度与章节">
      <span className="depth-heading">深度 / DEPTH</span>
      {chapters.map((chapter, index) => <a href={`#${chapter.id}`} key={chapter.id} aria-label={`${chapter.name}，${chapter.depth} 米`} aria-current={active === index ? 'location' : undefined}><i/><span>{chapter.depth}<small> m</small></span></a>)}
    </nav>

    <dialog ref={dialog} className="inspection" aria-labelledby="inspection-title" onClose={() => setInspection(null)} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close() }}>
      {inspection && <article>
        <div className="inspection-top"><span>档案检视 / SPECIMEN VIEW</span><button type="button" aria-label="关闭检视" onClick={() => dialog.current?.close()}><Icon name="close"/></button></div>
        <div className={`inspection-image view-${view}`}><img src={asset(inspection)} alt={`${inspection.specimen}${view === 0 ? '全景' : '近景'}`}/></div>
        <div className="view-controls" aria-label="检视视角">{['全景', '近景'].map((label, index) => <button key={label} type="button" aria-pressed={view === index} onClick={() => setView(index)}>{label}</button>)}</div>
        <div className="inspection-body"><p className="inspection-latin">{inspection.latin}</p><h2 id="inspection-title">{inspection.specimen}</h2>
        <dl>{inspection.params.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
        <p>{inspection.note}</p></div>
      </article>}
    </dialog>
  </>
}

createRoot(document.getElementById('root')!).render(<StrictMode><App/></StrictMode>)
