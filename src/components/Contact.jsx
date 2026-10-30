import { useContent } from '../content.jsx'
import FadeIn from './FadeIn.jsx'
import { ContactButton } from './Buttons.jsx'

export default function Contact() {
  const { profile } = useContent()
  return (
    <section className="contact2" id="contact">
      <div className="contact2__inner">
        <FadeIn y={40}>
          <p className="contact2__kicker">THANKS FOR WATCHING</p>
          <h2 className="hero-heading contact2__heading">联系我</h2>
        </FadeIn>
        <FadeIn y={30} delay={0.15}>
          <div className="contact2__ways">
            <a className="contact2__way" href={`mailto:${profile.email}`}>
              <span className="contact2__way-label">EMAIL</span>
              <span className="contact2__way-value">{profile.email}</span>
            </a>
            <a className="contact2__way" href={`tel:${profile.phone}`}>
              <span className="contact2__way-label">PHONE</span>
              <span className="contact2__way-value">{profile.phone}</span>
            </a>
            <div className="contact2__way">
              <span className="contact2__way-label">CITY</span>
              <span className="contact2__way-value">{profile.location}</span>
            </div>
          </div>
        </FadeIn>
        <FadeIn y={20} delay={0.3}>
          <div className="contact2__cta">
            <ContactButton label="马上聊聊" />
          </div>
        </FadeIn>
        <p className="contact2__bottom">
          © 2026 {profile.name} · {profile.role} — {profile.location} / {profile.status}
        </p>
      </div>
    </section>
  )
}
