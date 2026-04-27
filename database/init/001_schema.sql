CREATE TABLE IF NOT EXISTS branches (
  id text PRIMARY KEY,
  name text NOT NULL,
  color text NOT NULL
);

CREATE TABLE IF NOT EXISTS stations (
  id text PRIMARY KEY,
  branch_id text NOT NULL REFERENCES branches(id),
  name text NOT NULL,
  station_order integer NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  underground boolean NOT NULL DEFAULT true,
  node_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS station_neighbors (
  station_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  neighbor_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  PRIMARY KEY (station_id, neighbor_id)
);

CREATE TABLE IF NOT EXISTS station_load_snapshots (
  id bigserial PRIMARY KEY,
  station_id text NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
  measured_at timestamptz NOT NULL DEFAULT now(),
  current_load integer NOT NULL CHECK (current_load >= 0 AND current_load <= 100),
  time_until_next_seconds integer NOT NULL CHECK (time_until_next_seconds >= 0),
  source text NOT NULL DEFAULT 'generator'
);

CREATE INDEX IF NOT EXISTS station_load_snapshots_station_measured_idx
  ON station_load_snapshots (station_id, measured_at DESC);
