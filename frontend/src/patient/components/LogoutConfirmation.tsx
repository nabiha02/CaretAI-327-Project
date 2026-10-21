import { Icon } from "./Icon";
import { Button } from "./Button";

export function LogoutConfirmation({
  open,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <div className="delete-modal logout-modal" role="dialog" aria-modal="true" aria-labelledby="logout-title">
        <span className="delete-modal__icon"><Icon name="logout" size={21} /></span>
        <div className="section-title" id="logout-title">Log out of CARETAI?</div>
        <p>You will need to sign in again to access patient visits, care plans, and settings.</p>
        <div><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button onClick={onConfirm}>Log out</Button></div>
      </div>
    </div>
  );
}
