import { pool } from "../db/pool.js";

export async function getLatestStationLoads(stationIds) {
  if (!pool || stationIds.length === 0) {
    return new Map();
  }

  const { rows } = await pool.query(
    `
      SELECT DISTINCT ON (station_id)
        station_id,
        current_load
      FROM station_load_snapshots
      WHERE station_id = ANY($1::text[])
      ORDER BY station_id, measured_at DESC
    `,
    [stationIds]
  );

  return new Map(rows.map((row) => [row.station_id, Number(row.current_load)]));
}
