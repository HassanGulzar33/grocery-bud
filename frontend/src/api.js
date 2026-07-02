const BASE_URL = "/api/items";
const API_KEY = import.meta.env.VITE_API_KEY;

function getHeaders() {
  const headers = { "Content-Type": "application/json" };
  if (API_KEY) {
    headers["Authorization"] = `Bearer ${API_KEY}`;
  }
  return headers;
}

export async function fetchItems() {
  const res = await fetch(BASE_URL, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function fetchHistory() {
  const res = await fetch("/api/history", {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function createItem(item) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to create item");
  }
  return res.json();
}

export async function updateItem(id, updates) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to update item");
  }
  return res.json();
}

export async function deleteItem(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete item");
  }
}

