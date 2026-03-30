from sqlalchemy import (MetaData, ARRAY, Uuid)
from  typing import List
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from uuid import UUID
import sqlalchemy

URL = "postgresql://airflow:airflow@localhost:5433/airflow"

engine = sqlalchemy.create_engine(URL)

meta = MetaData()


class Base(DeclarativeBase):
    pass


class Node(Base):
    __tablename__ = 'node'

    id: Mapped[UUID] = mapped_column(primary_key=True, unique=True)
    station_id: Mapped[UUID] = mapped_column()
    duration: Mapped[float] = mapped_column()
    type: Mapped[str] = mapped_column()
    coefficient: Mapped[float] = mapped_column()


class Station(Base):
    __tablename__ = 'station',

    id: Mapped[UUID] = mapped_column(primary_key=True, unique=True)
    branch_id: Mapped[UUID] = mapped_column(),
    name: Mapped[str] = mapped_column()
    average_load: Mapped[float] = mapped_column()
    current_load: Mapped[float] = mapped_column()
    load_ratio: Mapped[float] = mapped_column()
    neighbor_ids: Mapped[List[UUID]] = mapped_column(
        ARRAY(Uuid(as_uuid=True)),
        nullable=True,
        default=list
    )
    underground: Mapped[bool] = mapped_column()
    time_until_next: Mapped[float] = mapped_column()
    coordinates_id: Mapped[UUID] = mapped_column()
    node_id: Mapped[UUID] = mapped_column()


class Coordinates(Base):
    __tablename__ = 'coordinates'

    id: Mapped[UUID] = mapped_column(primary_key=True, unique=True)
    station_id: Mapped[UUID] = mapped_column()
    type: Mapped[str] = mapped_column()
    x: Mapped[float] = mapped_column()
    y: Mapped[float] = mapped_column()
    z: Mapped[float] = mapped_column()


class Branch(Base):
    __tablename__ = 'branch'

    id: Mapped[UUID] = mapped_column(primary_key=True, unique=True)
    color: Mapped[str] = mapped_column()
    name: Mapped[str] = mapped_column()


class InventoryPark(Base):
    __tablename__ = 'inventory_park'

    id: Mapped[UUID] = mapped_column(primary_key=True, unique=True)
    branch_id: Mapped[UUID] = mapped_column()
    count_locomotive: Mapped[int] = mapped_column()
    count_carriage: Mapped[int] = mapped_column()
    usage_coefficient: Mapped[float] = mapped_column()
    wear_coefficient: Mapped[float] = mapped_column()


Base.metadata.create_all(engine)
