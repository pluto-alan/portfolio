import FadeIn from './FadeIn.jsx'
import { services } from '../data.js'

export default function Services() {
  return (
    <section className="services" id="services">
      <FadeIn y={40}>
        <h2 className="services__heading">服务</h2>
      </FadeIn>
      <div className="services__list">
        {services.map((s, i) => (
          <FadeIn key={s.num} y={30} delay={i * 0.1}>
            <div className="service-item">
              <span className="service-item__num">{s.num}</span>
              <div className="service-item__body">
                <h3 className="service-item__name">{s.name}</h3>
                <p className="service-item__desc">{s.desc}</p>
              </div>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  )
}
