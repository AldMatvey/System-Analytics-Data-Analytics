from datetime import datetime
from typing import List

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel


class StationSchema(BaseModel):
    station_id: str
    branch_id: str
    branch_name: str
    branch_color: str
    name: str
    station_order: int
    current_load: int
    neighbour_ids: List[str]
    underground: bool
    time_until_next: int
    coordinates_id: str
    latitude: float
    longitude: float
    node_id: str


STATIONS = [
    {"station_id": "5.82", "name": "Новослободская", "latitude": 55.779606, "longitude": 37.601252, "station_order": 0},
    {"station_id": "5.119", "name": "Проспект Мира", "latitude": 55.779584, "longitude": 37.633646, "station_order": 1},
    {"station_id": "5.55", "name": "Комсомольская", "latitude": 55.775672, "longitude": 37.654772, "station_order": 2},
    {"station_id": "5.71", "name": "Курская", "latitude": 55.758631, "longitude": 37.661059, "station_order": 3},
    {"station_id": "5.76", "name": "Таганская", "latitude": 55.742396, "longitude": 37.653334, "station_order": 4},
    {"station_id": "5.102", "name": "Павелецкая", "latitude": 55.731414, "longitude": 37.636294, "station_order": 5},
    {"station_id": "5.36", "name": "Добрынинская", "latitude": 55.728994, "longitude": 37.622533, "station_order": 6},
    {"station_id": "5.93", "name": "Октябрьская", "latitude": 55.729264, "longitude": 37.611049, "station_order": 7},
    {"station_id": "5.104", "name": "Парк культуры", "latitude": 55.735221, "longitude": 37.593095, "station_order": 8},
    {"station_id": "5.49", "name": "Киевская", "latitude": 55.74361, "longitude": 37.56735, "station_order": 10},
    {"station_id": "5.58", "name": "Краснопресненская", "latitude": 55.760378, "longitude": 37.577114, "station_order": 11},
    {"station_id": "5.20", "name": "Белорусская", "latitude": 55.775179, "longitude": 37.582303, "station_order": 12},
]

app = FastAPI(title="Mock data for metro stations")


def get_hour_pressure(hour: int) -> float:
    if hour in [1, 2, 3, 4, 5]:
        return 0.0
    if hour in [7, 8, 9, 17, 18, 19]:
        return 0.78
    if hour in [10, 11, 12, 13, 14, 15, 16, 20, 21]:
        return 0.46
    return 0.22


def seeded_noise(station: dict, current_time: datetime) -> float:
    minute_bucket = current_time.minute // 5
    seed = f"{station['station_id']}:{current_time.hour}:{minute_bucket}"
    value = 0

    for char in seed:
        value = (value * 31 + ord(char)) % 997

    return (value / 997 - 0.5) * 18


def get_neighbour_ids(station: dict) -> List[str]:
    sorted_stations = sorted(STATIONS, key=lambda item: item["station_order"])
    station_index = next(index for index, item in enumerate(sorted_stations) if item["station_id"] == station["station_id"])
    previous_station = sorted_stations[(station_index - 1) % len(sorted_stations)]
    next_station = sorted_stations[(station_index + 1) % len(sorted_stations)]

    return [previous_station["station_id"], next_station["station_id"]]


def generate_station_data(station: dict) -> StationSchema:
    current_time = datetime.now()
    hour_pressure = get_hour_pressure(current_time.hour)
    station_pressure = 0.22 + (station["station_order"] % 5) * 0.07

    if current_time.hour in [1, 2, 3, 4, 5]:
        current_load = 0
        time_until_next = 0
    else:
        current_load = round((hour_pressure + station_pressure) * 70 + seeded_noise(station, current_time))
        current_load = max(5, min(100, current_load))
        time_base = 85 if hour_pressure > 0.7 else 145
        time_until_next = max(45, round(time_base + seeded_noise(station, current_time) * 2))

    return StationSchema(
        station_id=station["station_id"],
        branch_id="5",
        branch_name="Кольцевая",
        branch_color="#915133",
        name=station["name"],
        station_order=station["station_order"],
        current_load=current_load,
        neighbour_ids=get_neighbour_ids(station),
        underground=True,
        time_until_next=time_until_next,
        coordinates_id=station["station_id"],
        latitude=station["latitude"],
        longitude=station["longitude"],
        node_id=f"ring-{station['station_order']}",
    )


@app.get("/health")
async def health():
    return {"status": "ok", "service": "fastapi-data-generator"}


@app.get("/generate/stations/{station_id}", response_model=StationSchema)
async def get_station_data(station_id: str):
    station = next((item for item in STATIONS if item["station_id"] == station_id), None)

    if station is None:
        raise HTTPException(status_code=404, detail="Station not found")

    return generate_station_data(station)


@app.get("/generate/stations", response_model=List[StationSchema])
async def get_all_station_data():
    return [generate_station_data(station) for station in STATIONS]
