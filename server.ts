import express from "express";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import Database from "better-sqlite3";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "smart-traffic-secret";
const db = new Database("traffic.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password_hash TEXT
  );

  CREATE TABLE IF NOT EXISTS traffic_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    source_ip TEXT,
    destination_ip TEXT,
    domain TEXT,
    protocol TEXT,
    upload_bytes INTEGER,
    download_bytes INTEGER
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data_limit_gb REAL DEFAULT 100,
    alerts_enabled INTEGER DEFAULT 1
  );

  INSERT OR IGNORE INTO settings (id, data_limit_gb, alerts_enabled) VALUES (1, 100, 1);
`);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- API Routes ---

  app.post("/api/auth/signup", async (req, res) => {
    const { username, email, password } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)");
      stmt.run(username, email, hash);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { username: user.username, email: user.email } });
  });

  app.get("/api/traffic/summary", authenticate, (req, res) => {
    const stats = db.prepare(`
      SELECT 
        SUM(upload_bytes) as total_upload,
        SUM(download_bytes) as total_download,
        COUNT(*) as total_packets
      FROM traffic_logs
      WHERE timestamp > datetime('now', '-30 days')
    `).get();
    
    const topDomains = db.prepare(`
      SELECT domain, SUM(upload_bytes + download_bytes) as total_bytes
      FROM traffic_logs
      GROUP BY domain
      ORDER BY total_bytes DESC
      LIMIT 5
    `).all();

    const protocolStats = db.prepare(`
      SELECT protocol, COUNT(*) as count
      FROM traffic_logs
      GROUP BY protocol
    `).all();

    res.json({ stats, topDomains, protocolStats });
  });

  app.get("/api/traffic/history", authenticate, (req, res) => {
    const history = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
        SUM(upload_bytes) as upload,
        SUM(download_bytes) as download
      FROM traffic_logs
      WHERE timestamp > datetime('now', '-24 hours')
      GROUP BY hour
      ORDER BY hour ASC
    `).all();
    res.json(history);
  });

  app.get("/api/settings", authenticate, (req, res) => {
    const config = db.prepare("SELECT * FROM settings WHERE id = 1").get();
    res.json(config);
  });

  app.post("/api/settings", authenticate, (req, res) => {
    const { data_limit_gb, alerts_enabled } = req.body;
    db.prepare("UPDATE settings SET data_limit_gb = ?, alerts_enabled = ? WHERE id = 1")
      .run(data_limit_gb, alerts_enabled ? 1 : 0);
    res.json({ success: true });
  });

  // --- Traffic Simulator ---
  const domains = ["google.com", "github.com", "youtube.com", "netflix.com", "amazon.com", "facebook.com", "twitter.com", "reddit.com", "microsoft.com", "apple.com"];
  const protocols = ["HTTPS", "HTTP", "DNS", "TCP", "UDP"];

  setInterval(() => {
    const domain = domains[Math.floor(Math.random() * domains.length)];
    const protocol = protocols[Math.floor(Math.random() * protocols.length)];
    const upload = Math.floor(Math.random() * 50000);
    const download = Math.floor(Math.random() * 500000);
    const sourceIp = `192.168.1.${Math.floor(Math.random() * 255)}`;
    const destIp = `104.26.12.${Math.floor(Math.random() * 255)}`;

    const stmt = db.prepare(`
      INSERT INTO traffic_logs (source_ip, destination_ip, domain, protocol, upload_bytes, download_bytes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(sourceIp, destIp, domain, protocol, upload, download);
    
    const logEntry = {
      id: info.lastInsertRowid,
      timestamp: new Date().toISOString(),
      source_ip: sourceIp,
      destination_ip: destIp,
      domain,
      protocol,
      upload_bytes: upload,
      download_bytes: download
    };

    // Broadcast to all connected clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "TRAFFIC_UPDATE", data: logEntry }));
      }
    });
  }, 2000);

  // --- Vite Integration ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
