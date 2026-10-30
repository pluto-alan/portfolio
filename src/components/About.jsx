import FadeIn from './FadeIn.jsx'
import AnimatedText from './AnimatedText.jsx'
import Magnet from './Magnet.jsx'
import { ContactButton } from './Buttons.jsx'
import { useContent } from '../content.jsx'

export default function About() {
  const { profile } = useContent()
  const text = (profile.intro || []).join('')

  return (
    <section className="about2" id="about">
      {/* 四角装饰 */}
      <FadeIn delay={0.1} x={-80} y={0} duration={0.9} className="about2__deco about2__deco--tl">
        <div className="blob about2__blob about2__blob--a" />
      </FadeIn>
      <FadeIn delay={0.25} x={-80} y={0} duration={0.9} className="about2__deco about2__deco--bl">
        <div className="ring about2__ring" />
      </FadeIn>
      <FadeIn delay={0.15} x={80} y={0} duration={0.9} className="about2__deco about2__deco--tr">
        <div className="blob about2__blob about2__blob--b" />
      </FadeIn>
      <FadeIn delay={0.3} x={80} y={0} duration={0.9} className="about2__deco about2__deco--br">
        <div className="ring about2__ring about2__ring--s" />
      </FadeIn>

      <div className="about2__center">
        <FadeIn y={30} delay={0.05}>
          <div className="about2__portrait">
            <Magnet padding={100} strength={3}>
              <img src={profile.avatar} alt={`${profile.name} 形象照`} />
            </Magnet>
          </div>
        </FadeIn>
        <FadeIn y={40}>
          <h2 className="hero-heading about2__heading">关于我</h2>
        </FadeIn>
        <AnimatedText text={text} className="about2__text" />
        <FadeIn y={20} delay={0.2}>
          <div className="about2__skills">
            {profile.skills.map((s) => (
              <span className="chip chip--dark" key={s}>{s}</span>
            ))}
          </div>
        </FadeIn>
        <FadeIn y={20} delay={0.3}>
          <Magnet padding={80} strength={4}>
            <ContactButton />
          </Magnet>
        </FadeIn>
      </div>
    </section>
  )
}
