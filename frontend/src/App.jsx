import { useEffect, useState } from "react";
import AddItemForm from "./components/AddItemForm.jsx";
import GroceryList from "./components/GroceryList.jsx";
import PurchaseHistory from "./components/PurchaseHistory.jsx";
import { fetchItems, fetchHistory, createItem, updateItem, deleteItem } from "./api.js";

export default function App() {
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("list");

  useEffect(() => {
    loadItems();
    loadHistory();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await fetchItems();
      setItems(data);
      setError("");
    } catch (err) {
      setError("Could not load items. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const data = await fetchHistory();
      setHistory(data);
    } catch (err) {
      console.error("Could not load history", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const triggerError = (msg) => {
    setError(msg);
    setTimeout(() => {
      setError("");
    }, 4000);
  };

  const handleAdd = async (item) => {
    try {
      const newItem = await createItem(item);
      setItems((prev) => [newItem, ...prev]);
    } catch (err) {
      triggerError(err.message || "Could not add item.");
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      const updated = await updateItem(id, updates);

      // If item was checked (bought), remove from shopping list → moves to history
      if (updates.checked) {
        setItems((prev) => prev.filter((i) => i.id !== id));
        // Refresh history to show the newly bought item
        loadHistory();
      } else {
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
      }
    } catch (err) {
      triggerError(err.message || "Could not update item.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      triggerError(err.message || "Could not delete item.");
    }
  };

  const totalHistoryItems = history.reduce((sum, m) => sum + m.totalItems, 0);

  return (
    <div className="app">
      <div className="container">
        <h1>🛒 Grocery Bud</h1>
        <p className="subtitle">
          {items.length === 0
            ? "Nothing on your list yet"
            : `${items.length} item${items.length !== 1 ? "s" : ""} to buy`}
        </p>

        {/* Tab Navigation */}
        <div className="tab-nav">
          <button
            className={`tab-btn ${activeTab === "list" ? "active" : ""}`}
            onClick={() => setActiveTab("list")}
          >
            <span className="tab-icon">📝</span>
            <span>Shopping List</span>
            {items.length > 0 && <span className="tab-count">{items.length}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("history");
              loadHistory(); // refresh history when switching to tab
            }}
          >
            <span className="tab-icon">📊</span>
            <span>History</span>
            {totalHistoryItems > 0 && <span className="tab-count">{totalHistoryItems}</span>}
          </button>
        </div>

        {error && <p className="error-banner">{error}</p>}

        {/* Tab Content */}
        {activeTab === "list" && (
          <div className="tab-content">
            <AddItemForm onAdd={handleAdd} />
            {loading ? (
              <p className="loading-state">Loading...</p>
            ) : (
              <GroceryList items={items} onUpdate={handleUpdate} onDelete={handleDelete} />
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="tab-content">
            <PurchaseHistory
              history={history}
              loading={historyLoading}
              onReadd={(id) => handleUpdate(id, { checked: false })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
