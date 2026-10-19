import { AdminIcon, type AdminIconName } from "./AdminIcon";

export function StatCard({
  label,
  value,
  detail,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  detail: string;
  icon: AdminIconName;
  onClick: () => void;
}) {
  return (
    <button className="admin-stat-card" type="button" onClick={onClick}>
      <span className="admin-stat-card__icon"><AdminIcon name={icon} size={20} /></span>
      <span className="admin-stat-card__copy">
        <small>{label}</small>
        <strong>{value.toLocaleString()}</strong>
        <span>{detail}</span>
      </span>
      <span className="admin-stat-card__arrow"><AdminIcon name="arrow" size={15} /></span>
    </button>
  );
}
