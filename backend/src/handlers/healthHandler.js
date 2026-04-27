import { isDatabaseEnabled, pool } from "../db/pool.js";

export async function healthHandler(_req, res) {
  if (!isDatabaseEnabled()) {
    res.json({ status: "ok", database: "disabled" });
    return;
  }

  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", database: "ok" });
  } catch {
    res.json({ status: "ok", database: "unavailable" });
  }
}
