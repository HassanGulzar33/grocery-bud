import { useState } from "react";

export default function PurchaseHistory({ history, loading }) {
  const [expandedMonth, setExpandedMonth] = useState(null);

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  if (loading) {
    return <p className="loading-state">Loading history...</p>;
  }

  if (!history || history.length === 0) {
    return (
      <div className="history-empty">
        <div className="empty-icon">🛍️</div>
        <p>No purchase history yet.</p>
        <p className="history-empty-hint">When you check off items as bought, they'll appear here.</p>
      </div>
    );
  }

  const toggleMonth = (month) => {
    setExpandedMonth(expandedMonth === month ? null : month);
  };

  return (
    <div className="history-section">
      <div className="history-header">
        <h2>📊 Purchase History</h2>
        <p className="history-subtitle">Items you bought in the last 2 months</p>
        <p className="history-note">🕐 Older items are automatically archived</p>
      </div>

      <div className="history-months">
        {history.map((m) => (
          <div key={m.month} className="history-month-card">
            <button
              className={`month-toggle ${expandedMonth === m.month ? "expanded" : ""}`}
              onClick={() => toggleMonth(m.month)}
            >
              <div className="month-info">
                <span className="month-name">{m.month}</span>
                <div className="month-stats">
                  <span className="stat-badge total">{m.totalItems} bought</span>
                  <span className="stat-badge unique">{m.uniqueItems} unique</span>
                </div>
              </div>
              <span className="chevron">{expandedMonth === m.month ? "▲" : "▼"}</span>
            </button>

            {expandedMonth === m.month && (
              <div className="month-details">
                {/* Top bought items */}
                <div className="top-items-section">
                  <h4>🔥 Most Bought</h4>
                  <div className="top-items-grid">
                    {m.topItems.map((ti, idx) => (
                      <div key={idx} className="top-item-chip">
                        <span className="top-item-rank">#{idx + 1}</span>
                        <span className="top-item-name">{ti.name}</span>
                        <span className="top-item-count">×{ti.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* All items list */}
                <div className="history-items-list">
                  <h4>📋 All Purchases</h4>
                  <ul className="history-items">
                    {m.items.map((item) => (
                      <li key={item.id} className="history-item bought">
                        <span className="history-item-status">✅</span>
                        <span className="history-item-name">{item.name}</span>
                        <span className="history-item-qty">×{item.quantity}</span>
                        <span className="history-item-date">{formatDate(item.created_at)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
