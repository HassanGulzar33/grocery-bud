import { createPortal } from "react-dom";

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-body">{message}</p>
        <div className="modal-actions">
          <button className="btn btn-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-modal-confirm" onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
