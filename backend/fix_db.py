import sqlite3
conn = sqlite3.connect('centleos.db')
conn.execute("UPDATE alembic_version SET version_num = '42b143738072'")
conn.commit()
conn.close()
