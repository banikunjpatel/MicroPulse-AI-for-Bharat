import pandas as pd
import random
from datetime import datetime, timedelta

def generate_sales_data(days=30, seed=42):
    random.seed(seed)
    start_date = datetime.today()
    data = []

    for i in range(days):
        date = start_date + timedelta(days=i)
        sales = random.randint(100, 250)
        data.append({"date": date.strftime("%Y-%m-%d"), "sales": sales})

    return pd.DataFrame(data)
