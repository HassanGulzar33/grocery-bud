import { useState } from "react";

export default function AddItemForm({ onAdd }) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter an item name");
      return;
    }
    setError("");
    await onAdd({ name, quantity });
    setName("");
    setQuantity("1");
  };

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <input
          type="text"
          placeholder="e.g. Tomatoes"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input-name"
        />
        <input
          type="text"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="input-qty"
        />
        <button type="submit" className="btn btn-add">
          Add
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </form>
  );
}
