import { useState } from "react";
import ConfirmModal from "./ConfirmModal.jsx";

export default function GroceryItem({ item, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [buying, setBuying] = useState(false);
  
  // Custom Modal configuration state
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const handleSaveTrigger = () => {
    if (!name.trim()) return;
    
    const hasChanged = name.trim() !== item.name || quantity.trim() !== item.quantity;
    if (hasChanged) {
      setModalConfig({
        isOpen: true,
        title: "Update Item Details",
        message: `Are you sure you want to save changes to this item?`,
        onConfirm: async () => {
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
          await onUpdate(item.id, { name, quantity });
          setIsEditing(false);
        },
      });
    } else {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setName(item.name);
    setQuantity(item.quantity);
    setIsEditing(false);
  };

  const handleBuyTrigger = () => {
    setModalConfig({
      isOpen: true,
      title: "Confirm Purchase",
      message: `Mark "${item.name}" as bought? It will be moved to your history log.`,
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        setBuying(true);
        // Small delay for the exit animation
        setTimeout(() => {
          onUpdate(item.id, { checked: true });
        }, 400);
      },
    });
  };

  const handleDeleteTrigger = () => {
    setModalConfig({
      isOpen: true,
      title: "Delete Item",
      message: `Are you sure you want to delete "${item.name}" from your active list?`,
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        onDelete(item.id);
      },
    });
  };

  const handleModalCancel = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  if (isEditing) {
    return (
      <li className="grocery-item editing">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-name"
          autoFocus
        />
        <input
          type="text"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="input-qty"
        />
        <div className="item-actions">
          <button className="btn btn-save" onClick={handleSaveTrigger}>
            Save
          </button>
          <button className="btn btn-cancel" onClick={handleCancelEdit}>
            Cancel
          </button>
        </div>

        {/* Modal component rendered inside the conditional edit view */}
        <ConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={handleModalCancel}
        />
      </li>
    );
  }

  return (
    <li className={`grocery-item ${buying ? "buying-out" : ""}`}>
      <label className="item-label">
        <label className="checkbox-container">
          <input type="checkbox" checked={false} onChange={handleBuyTrigger} />
          <span className="checkmark"></span>
        </label>
        <span className="item-name">{item.name}</span>
        <span className="item-qty">x{item.quantity}</span>
      </label>
      <div className="item-actions">
        <button className="btn btn-edit" onClick={() => setIsEditing(true)}>
          Edit
        </button>
        <button className="btn btn-delete" onClick={handleDeleteTrigger}>
          Delete
        </button>
      </div>

      {/* Modal component rendered inside the item display view */}
      <ConfirmModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={handleModalCancel}
      />
    </li>
  );
}
