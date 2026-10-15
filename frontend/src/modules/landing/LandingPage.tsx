import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import BrandLogo from "../../components/BrandLogo";
import "./LandingPage.css";

const capabilities = [
  { icon: "↗", number: "01", title: "Gestión comercial", description: "Organiza clientes, productos, ventas y pagos desde una plataforma centralizada." },
  { icon: "▦", number: "02", title: "Inventario trazable", description: "Controla existencias, movimientos de stock y el historial Kardex." },
  { icon: "◈", number: "03", title: "Analytics inteligente", description: "Convierte los datos de negocio en indicadores, gráficos y análisis estadísticos." },
  { icon: "✧", number: "04", title: "Insights y reportes", description: "Explora observaciones comerciales y exporta información para tomar decisiones." },
];

const steps = [
  { number: "01", title: "Registra", description: "Centraliza las operaciones de tu negocio." },
  { number: "02", title: "Analiza", description: "Aplica estadística y visualiza tendencias." },
  { number: "03", title: "Decide", description: "Consulta indicadores, insights y reportes." },
];

export default function LandingPage() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const destination = user ? "/dashboard" : "/login";

  return (
    <div className="sl-landing">
      <header className="sl-header">
        <div className="sl-container sl-header-inner">
          <Link to="/" className="sl-brand" aria-label="SalesIA Enterprise, inicio" onClick={() => setMenuOpen(false)}>
            <BrandLogo size={38} />
            <span className="sl-brand-name">SalesIA <strong>Enterprise</strong></span>
          </Link>
          <button className="sl-menu-toggle" type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} aria-controls="sl-navigation" onClick={() => setMenuOpen(!menuOpen)}>
            <span /><span /><span />
          </button>
          <nav id="sl-navigation" aria-label="Navegación principal" className={`sl-nav ${menuOpen ? "is-open" : ""}`}>
            <a href="#caracteristicas" onClick={() => setMenuOpen(false)}>Características</a>
            <a href="#proceso" onClick={() => setMenuOpen(false)}>Cómo funciona</a>
            <a href="#tecnologia" onClick={() => setMenuOpen(false)}>Tecnología</a>
            <Link className="sl-nav-cta" to={destination} onClick={() => setMenuOpen(false)}>{user ? "Mi dashboard" : "Iniciar sesión"} <span aria-hidden="true">↗</span></Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="sl-hero" aria-labelledby="sl-hero-title">
          <div className="sl-glow sl-glow-one" aria-hidden="true" />
          <div className="sl-container sl-hero-grid">
            <div className="sl-hero-copy">
              <div className="sl-eyebrow"><span className="sl-live-dot" /> INTELIGENCIA COMERCIAL EN UNA PLATAFORMA</div>
              <h1 id="sl-hero-title">Tu negocio, <span>más claro.</span><br />Tus decisiones, <em>más inteligentes.</em></h1>
              <p className="sl-hero-desc">Gestiona ventas, clientes e inventario mientras transformas tus datos en información valiosa con análisis estadístico, indicadores e insights empresariales.</p>
              <div className="sl-hero-actions">
                <Link to={destination} className="sl-button sl-button-primary">Acceder al dashboard <span aria-hidden="true">↗</span></Link>
                <a className="sl-button sl-button-secondary" href="#caracteristicas">Explorar plataforma <span aria-hidden="true">↓</span></a>
              </div>
              <div className="sl-hero-proof"><span className="sl-proof-line" /><span>GESTIÓN + ANALYTICS + DECISIONES</span></div>
            </div>

            <div className="sl-preview-wrap" aria-label="Ilustración conceptual del panel de SalesIA Enterprise">
              <div className="sl-preview-orbit" aria-hidden="true" />
              <div className="sl-dashboard-preview">
                <div className="sl-preview-side">
                  <div className="sl-preview-logo"><BrandLogo size={28} /></div>
                  <div className="sl-preview-side-item active"><span /> </div>
                  <div className="sl-preview-side-item"><span /></div>
                  <div className="sl-preview-side-item"><span /></div>
                  <div className="sl-preview-side-item"><span /></div>
                </div>
                <div className="sl-preview-content">
                  <div className="sl-preview-top"><div><span className="sl-preview-overline">SALESIA / ANALYTICS</span><strong>Resumen comercial</strong></div><div className="sl-avatar">A</div></div>
                  <div className="sl-metric-grid">
                    <div className="sl-metric"><span>Ventas</span><strong>Visión general</strong><small>↗ Seguimiento</small></div>
                    <div className="sl-metric"><span>Inventario</span><strong>Control activo</strong><small>◈ Trazabilidad</small></div>
                    <div className="sl-metric sl-metric-third"><span>Reportes</span><strong>Información clara</strong><small>✧ Insights</small></div>
                  </div>
                  <div className="sl-chart-card"><div className="sl-chart-header"><div><strong>Evolución comercial</strong><span>Visualización ilustrativa</span></div><span className="sl-chart-tag">Analytics</span></div>
                    <svg className="sl-chart" viewBox="0 0 480 148" role="img" aria-label="Gráfico decorativo de evolución comercial, sin datos reales">
                      <defs><linearGradient id="slChartGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0891b2" stopOpacity=".24" /><stop offset="1" stopColor="#0891b2" stopOpacity="0" /></linearGradient></defs>
                      <path d="M0 30H480 M0 70H480 M0 110H480" stroke="#dbe7ed" strokeDasharray="4 7" fill="none" />
                      <path d="M0 120 C38 118 48 100 78 105 S130 65 164 78 S218 93 244 55 S295 66 330 45 S392 66 420 22 S455 28 480 8 L480 148 L0 148Z" fill="url(#slChartGradient)" />
                      <path d="M0 120 C38 118 48 100 78 105 S130 65 164 78 S218 93 244 55 S295 66 330 45 S392 66 420 22 S455 28 480 8" stroke="#0891b2" strokeWidth="3.4" strokeLinecap="round" fill="none" />
                      <circle cx="420" cy="22" r="5" fill="#0891b2" stroke="white" strokeWidth="3" />
                    </svg>
                  </div>
                  <div className="sl-preview-bottom"><span /><span /><span /></div>
                </div>
              </div>
              <div className="sl-floating-label"><span>✦</span><div><strong>Datos que impulsan</strong><small>decisiones informadas</small></div></div>
              <div className="sl-preview-caption">Vista conceptual · No representa datos reales</div>
            </div>
          </div>
        </section>

        <section className="sl-trust-band" aria-label="Áreas de la plataforma"><div className="sl-container sl-trust-content"><span>UNA SOLUCIÓN INTEGRAL</span><strong>Ventas</strong><i /> <strong>Inventario</strong><i /> <strong>Estadística</strong><i /> <strong>Analytics</strong><i /> <strong>Reportes</strong></div></section>

        <section className="sl-section sl-features" id="caracteristicas"><div className="sl-container"><div className="sl-section-heading"><span className="sl-section-kicker">FUNCIONALIDADES</span><h2>Todo conectado.<br /><span>Todo bajo control.</span></h2><p>De las operaciones diarias a una visión estratégica del negocio, en una sola plataforma.</p></div><div className="sl-features-grid">{capabilities.map((item) => <article className="sl-feature" key={item.number}><div className="sl-feature-top"><span className="sl-feature-icon" aria-hidden="true">{item.icon}</span><span className="sl-feature-number">{item.number}</span></div><h3>{item.title}</h3><p>{item.description}</p><div className="sl-feature-accent" /></article>)}</div></div></section>

        <section className="sl-section sl-process" id="proceso"><div className="sl-container"><div className="sl-section-heading sl-section-heading-center"><span className="sl-section-kicker">FLUJO DE TRABAJO</span><h2>De la operación a la <span>decisión.</span></h2><p>SalesIA integra la gestión comercial y el análisis de datos para apoyar decisiones fundamentadas.</p></div><div className="sl-steps">{steps.map((step) => <div className="sl-step" key={step.number}><span className="sl-step-number">{step.number}</span><h3>{step.title}</h3><p>{step.description}</p></div>)}</div></div></section>

        <section className="sl-section sl-tech" id="tecnologia"><div className="sl-container sl-tech-grid"><div><span className="sl-section-kicker">ARQUITECTURA MODERNA</span><h2>Tecnología preparada para <span>crecer.</span></h2><p>Una arquitectura modular que separa la experiencia de usuario, la lógica empresarial y la persistencia de datos.</p><Link to={destination} className="sl-text-link">Conocer la plataforma <span aria-hidden="true">↗</span></Link></div><div className="sl-tech-cards"><div><small>FRONTEND</small><strong>React + TypeScript</strong></div><div><small>BACKEND</small><strong>Python + FastAPI</strong></div><div><small>BASE DE DATOS</small><strong>PostgreSQL</strong></div><div><small>ANÁLISIS</small><strong>Estadística + Pandas</strong></div></div></div></section>

        <section className="sl-final-cta"><div className="sl-container sl-cta-inner"><div><span className="sl-section-kicker">EMPIEZA CON SALESIA</span><h2>Convierte tus datos en <span>mejores decisiones.</span></h2><p>Ingresa de forma segura a tu espacio de trabajo empresarial.</p></div><Link to={destination} className="sl-button sl-button-light">{user ? "Ir a mi dashboard" : "Iniciar sesión"}<span aria-hidden="true">↗</span></Link></div></section>
      </main>

      <footer className="sl-footer"><div className="sl-container sl-footer-content"><Link className="sl-brand" to="/"><BrandLogo size={38} /><span className="sl-brand-name">SalesIA <strong>Enterprise</strong></span></Link><p>Proyecto académico · Gestión comercial y analítica estadística</p><span>© {new Date().getFullYear()} SalesIA Enterprise</span></div></footer>
    </div>
  );
}
