from fastapi import FastAPI
from typing import List
from pydantic import BaseModel
from datetime import datetime
import json
import random


class StationSchema(BaseModel):
    station_id: int
    branch_id: int
    name: str
    current_load: float
    neighbour_ids: List[int]
    underground: bool
    time_until_next: float
    coordinates_id: int
    node_id: int


STATIONS = {
    1: {"name": "Щёлковская",
        "branch_id": 3,
        "underground": True,
        "node_id": 1,
        "neighbour_ids": []},
    2: {"name": "Первомайская",
        "branch_id": 3,
        "underground": True,
        "node_id": 1,
        "neighbour_ids": []},
}

app = FastAPI(title="Mock data for station")


def generate_random_flow() -> float:
    base = random.uniform(4.0, 35.0)
    current = base * random.uniform(0.7, 1.45)
    return round(current, 2)


def generate_time_until_next() -> float:
    if datetime.now().hour in [7, 8, 9, 17, 18, 19]:
        base = random.uniform(0, 120)
    else:
        base = random.uniform(100, 150)

    return round(float(base) + random.uniform(-10.1, 13.7), 2)


@app.get('/generate/stations/{station_id}', response_model=StationSchema)
async def get_station_data(station_id: int):
    if station_id not in STATIONS:
        return {"Error": "Station not found!"}

    station = STATIONS[station_id].copy()

    current_load = generate_random_flow()
    time_until_next = generate_time_until_next()

    result_data = {
        "station_id": station_id,
        "branch_id": station["branch_id"],
        "name": station["name"],
        "current_load": current_load,
        "neighbour_ids": station["neighbour_ids"],
        "underground": station["underground"],
        "time_until_next": time_until_next,
        "coordinates_id": station_id,
        "node_id": station["node_id"],
    }

    return result_data


@app.get('/generate/stations')
async def get_all_station_data():
    return [await get_station_data(station_id)
            for station_id, _ in STATIONS.items()]