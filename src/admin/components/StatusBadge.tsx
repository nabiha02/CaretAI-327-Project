import type { AdminVerificationStatus } from "../data/adminData";
import type { ProfessionalVerificationStatus } from "../data/adminVerificationData";

export function StatusBadge({ status }: { status: AdminVerificationStatus | ProfessionalVerificationStatus }) {
  const slug = status.toLowerCase().replaceAll(" ", "-");
  return <span className={`admin-status admin-status--${slug}`}><i />{status}</span>;
}
