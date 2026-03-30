import pandas
from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from datetime import datetime, timedelta
import sqlalchemy
import pandas as pd

#2. X-com - есть буфер для передачи данных между последовательными функциями (узлами графа)
# Context

default_args = {
    "owner": "airflow",
    "depends_on_past": False,
    "start_date": datetime.now(),
    "email": ["airflow@airflow.com"],
    "email_on_failure": False,
    "email_on_retry": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
    # 'queue': 'bash_queue',
    # 'pool': 'backfill',
    # 'priority_weight': 10,
    # 'end_date': datetime(2016, 1, 1),
}

metrodag = DAG("tutorial", default_args=default_args, catchup=False, schedule_interval=timedelta(1))

# 1. загрузить данные с сервера в формате json
# json --> dataframe
URL: str = "postgresql://airflow:airflow@localhost:5432/airflow"

def extract():
    pass
#2. обработка сырых данных через pandas
def transform(**context):
    pass
#    ti = context['ti']
#    ti.xcom_pull()
#3. Загрузка данных в базу данных
def load():
    pass

