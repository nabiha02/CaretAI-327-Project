import { Icon } from "./Icon";
import { navItems } from "../data/navigation";

export function PatientSidebar({
  activeNav,
  open,
  onNavigate,
  onLogout,
  onClose,
}: {
  activeNav: string;
  open: boolean;
  onNavigate: (label: string) => void;
  onLogout: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <button className={`mobile-sidebar-backdrop ${open ? "open" : ""}`} type="button" aria-label="Close navigation" onClick={onClose} />
      <aside className={`sidebar patient-sidebar ${open ? "patient-sidebar--open" : ""}`}>
        <div>
          <button className="brand brand--button" type="button" onClick={() => onNavigate("Home")} aria-label="CARETAI home">
            <span className="brand__mark"><Icon name="brand" size={25} /></span><span>CARETAI</span>
          </button>
          <nav className="nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <button className={`nav__item ${activeNav === item.label ? "nav__item--active" : ""}`} key={item.label} type="button" onClick={() => onNavigate(item.label)}>
                <Icon name={item.icon} size={19} /><span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
        <div className="account"><div className="avatar avatar--sidebar">CH</div><div className="account__copy"><strong>Chaiti</strong><span>Caregiver</span></div><button className="icon-button icon-button--quiet" type="button" aria-label="Log out" onClick={onLogout}><Icon name="logout" size={18} /></button></div>
      </aside>
    </>
  );
}
