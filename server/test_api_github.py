import requests

try:
    response = requests.post("http://127.0.0.1:8000/api/v1/sandbox/ingest-github", json={"url": "https://github.com/OCA/crm"})
    print("Status:", response.status_code)
    print("Body:", response.text[:500])
except Exception as e:
    print("Error:", str(e))
