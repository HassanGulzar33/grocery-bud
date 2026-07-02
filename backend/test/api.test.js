import test from "node:test";
import assert from "node:assert";

const BASE_URL = "http://localhost:5000";
const API_KEY = "grocery_super_secret_token_123";

test("Grocery Bud API Integration Tests", async (t) => {
  
  // 1. Test health check route
  await t.test("GET /api/health - Success status", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.status, "ok");
  });

  // 2. Test authorization guard
  await t.test("GET /api/items - Deny requests with missing auth headers", async () => {
    const res = await fetch(`${BASE_URL}/api/items`);
    assert.strictEqual(res.status, 401);
    const data = await res.json();
    assert.ok(data.error.toLowerCase().includes("unauthorized"));
  });

  // 3. Test validation for empty name field
  await t.test("POST /api/items - Reject empty name parameter with 400", async () => {
    const res = await fetch(`${BASE_URL}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ name: "", quantity: "1" })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.ok(data.error.includes("name"));
  });

  // 4. Test CRUD Lifecycle
  await t.test("POST, PUT, GET, DELETE - Verify full item lifecycle", async () => {
    const name = `Automation Egg ${Date.now()}`;
    const qty = "2 dozen";

    // Create (POST)
    const createRes = await fetch(`${BASE_URL}/api/items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ name, quantity: qty })
    });
    assert.strictEqual(createRes.status, 201);
    const createdItem = await createRes.json();
    assert.strictEqual(createdItem.name, name);
    assert.strictEqual(createdItem.quantity, qty);
    assert.strictEqual(createdItem.checked, false);

    const itemId = createdItem.id;

    // Read (GET active items)
    const getRes = await fetch(`${BASE_URL}/api/items`, {
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      }
    });
    assert.strictEqual(getRes.status, 200);
    const activeList = await getRes.json();
    const itemInList = activeList.find(i => i.id === itemId);
    assert.ok(itemInList);

    // Update (PUT check/mark bought)
    const updateRes = await fetch(`${BASE_URL}/api/items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`
      },
      body: JSON.stringify({ checked: true })
    });
    assert.strictEqual(updateRes.status, 200);
    const updatedItem = await updateRes.json();
    assert.strictEqual(updatedItem.checked, true);
    assert.ok(updatedItem.bought_at);

    // Delete (DELETE)
    const deleteRes = await fetch(`${BASE_URL}/api/items/${itemId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      }
    });
    assert.strictEqual(deleteRes.status, 204);
  });
});
