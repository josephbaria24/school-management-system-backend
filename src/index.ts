import app from "./app.js";
import pool from "./db.js";

const port = process.env.PORT || 3001;

// Database heartbeat check
pool.connect().then((client) => {
  console.log("[db]: Successfully connected to PostgreSQL");
  client.release();
}).catch((err) => {
  console.error("[db]: Database connection failed", err.stack);
});

app.listen(port, () => {
  console.log(`[server]: School System API is running at http://localhost:${port}`);
});
