# Grocery Bud 🛒

A fullstack grocery list app — add, edit, check off, and delete items.

## Stack
- **Frontend**: React 18 + Vite
- **Backend**: Node.js + Express
- **Storage**: lowdb (JSON file — zero setup, no native build tools needed)

## Project structure
```
grocery-bud/
├── backend/          Express REST API (port 5000)
│   ├── server.js     Routes: GET/POST/PUT/DELETE /api/items
│   └── db.js         lowdb setup (writes to grocery.json)
└── frontend/         React app (port 5173)
    └── src/
        ├── App.jsx
        ├── api.js
        └── components/
            ├── AddItemForm.jsx
            ├── GroceryList.jsx
            └── GroceryItem.jsx
```

## Running locally

**1. Backend**
```bash
cd backend
npm install
npm run dev      # or: npm start
```
Runs on http://localhost:5000. Data persists to `backend/grocery.json` (auto-created).

**2. Frontend** (in a new terminal)
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173. Vite proxies `/api/*` requests to the backend (see `vite.config.js`), so no CORS config needed in dev.

Open http://localhost:5173 in your browser.

## API reference

| Method | Endpoint          | Body                              | Description          |
|--------|-------------------|------------------------------------|-----------------------|
| GET    | /api/items        | —                                  | List all items        |
| POST   | /api/items        | `{ name, quantity }`               | Create an item        |
| PUT    | /api/items/:id    | `{ name?, quantity?, checked? }`   | Update an item        |
| DELETE | /api/items/:id    | —                                  | Delete an item        |

## Building for production

```bash
cd frontend
npm run build
```
This outputs static files to `frontend/dist/`. Serve them with Nginx and reverse-proxy `/api` to the Express backend (running via pm2 or systemd), e.g.:

```nginx
server {
    listen 80;
    server_name grocery.example.com;

    root /var/www/grocery-bud/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Keep the backend alive with pm2:
```bash
cd backend
npm install
pm2 start server.js --name grocery-bud-api
```

## Swapping storage later
`db.js` is the only file that touches storage. If you outgrow the JSON file (e.g. want Postgres or MySQL), you only need to rewrite `db.js` and the query calls in `server.js` — the frontend and API contract stay the same.

## Notes
- Originally scaffolded with `better-sqlite3`, but swapped to `lowdb` (pure JS) since sqlite requires a native compile step. If you'd rather use SQLite, `npm install better-sqlite3` locally (not in this sandbox) and swap `db.js` back to synchronous SQL calls.
# grocery-bud
