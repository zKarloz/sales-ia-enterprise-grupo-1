export default function Topbar() {
  return (
    <header className="topbar">
      <div>
        <span className="topbar__eyebrow">Panel empresarial</span>
        <h2>SalesIA Enterprise</h2>
      </div>

      <div className="topbar__user">
        <div className="topbar__avatar">U</div>

        <div>
          <strong>Usuario</strong>
          <span>Administrador</span>
        </div>
      </div>
    </header>
  );
}