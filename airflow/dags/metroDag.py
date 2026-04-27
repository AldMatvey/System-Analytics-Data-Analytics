import json
import os
from datetime import datetime, timedelta
from urllib.request import urlopen

from airflow import DAG
from airflow.operators.python import PythonOperator

from database import ensure_schema, get_connection


GENERATOR_URL = os.environ.get("METRO_GENERATOR_URL", "http://data-generator:8000")

default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "start_date": datetime(2026, 1, 1),
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=1),
}


def extract(**context):
    with urlopen(f"{GENERATOR_URL}/generate/stations", timeout=10) as response:
        raw_data = response.read().decode("utf-8")

    context["ti"].xcom_push(key="raw_stations", value=raw_data)


def transform(**context):
    raw_data = context["ti"].xcom_pull(task_ids="extract", key="raw_stations")
    stations = json.loads(raw_data)

    transformed = [
        {
            "station_id": item["station_id"],
            "branch_id": item["branch_id"],
            "branch_name": item["branch_name"],
            "branch_color": item["branch_color"],
            "name": item["name"],
            "station_order": item["station_order"],
            "current_load": int(item["current_load"]),
            "neighbour_ids": item["neighbour_ids"],
            "underground": bool(item["underground"]),
            "time_until_next": int(item["time_until_next"]),
            "latitude": float(item["latitude"]),
            "longitude": float(item["longitude"]),
            "node_id": item["node_id"],
        }
        for item in stations
    ]

    context["ti"].xcom_push(key="stations", value=transformed)


def load(**context):
    ensure_schema()
    stations = context["ti"].xcom_pull(task_ids="transform", key="stations")

    with get_connection() as connection:
        with connection.cursor() as cursor:
            for station in stations:
                cursor.execute(
                    """
                    INSERT INTO branches (id, name, color)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (id) DO UPDATE
                    SET name = EXCLUDED.name,
                        color = EXCLUDED.color
                    """,
                    (station["branch_id"], station["branch_name"], station["branch_color"]),
                )

            for station in stations:
                cursor.execute(
                    """
                    INSERT INTO stations (
                      id,
                      branch_id,
                      name,
                      station_order,
                      latitude,
                      longitude,
                      underground,
                      node_id
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE
                    SET branch_id = EXCLUDED.branch_id,
                        name = EXCLUDED.name,
                        station_order = EXCLUDED.station_order,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        underground = EXCLUDED.underground,
                        node_id = EXCLUDED.node_id
                    """,
                    (
                        station["station_id"],
                        station["branch_id"],
                        station["name"],
                        station["station_order"],
                        station["latitude"],
                        station["longitude"],
                        station["underground"],
                        station["node_id"],
                    ),
                )

            for station in stations:
                for neighbour_id in station["neighbour_ids"]:
                    cursor.execute(
                        """
                        INSERT INTO station_neighbors (station_id, neighbor_id)
                        VALUES (%s, %s)
                        ON CONFLICT DO NOTHING
                        """,
                        (station["station_id"], neighbour_id),
                    )

                cursor.execute(
                    """
                    INSERT INTO station_load_snapshots (
                      station_id,
                      current_load,
                      time_until_next_seconds,
                      source
                    )
                    VALUES (%s, %s, %s, 'airflow')
                    """,
                    (
                        station["station_id"],
                        station["current_load"],
                        station["time_until_next"],
                    ),
                )


with DAG(
    dag_id="metro_load_pipeline",
    default_args=default_args,
    catchup=False,
    schedule_interval=timedelta(minutes=1),
    tags=["metro", "generator", "postgres"],
) as metrodag:
    extract_task = PythonOperator(task_id="extract", python_callable=extract)
    transform_task = PythonOperator(task_id="transform", python_callable=transform)
    load_task = PythonOperator(task_id="load", python_callable=load)

    extract_task >> transform_task >> load_task
