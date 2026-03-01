import requests

try:
    res = requests.post(
        'http://127.0.0.1:8000/api/v1/sandbox/simulate-impact',
        json={'file_id': 'crm_lead.py', 'new_code': 'some text'}
    )
    print("STATUS:", res.status_code)
    print("TEXT:", res.text)
except Exception as e:
    print("ERROR:", e)
