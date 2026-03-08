import json

def save_json(data, filepath):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)
