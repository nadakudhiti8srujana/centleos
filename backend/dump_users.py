import sqlite3
import json

conn = sqlite3.connect('centleos.db')
cursor = conn.cursor()
cursor.execute("SELECT email, role FROM users")
print(json.dumps(cursor.fetchall(), indent=2))
