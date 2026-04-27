from datetime import datetime

from airflow import DAG
from airflow.operators.bash import BashOperator


with DAG(
    dag_id="tutorial",
    start_date=datetime(2026, 1, 1),
    catchup=False,
    schedule_interval=None,
    tags=["example"],
) as dag:
    BashOperator(
        task_id="hello",
        bash_command="echo Airflow is connected",
    )
