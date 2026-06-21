import sqlite3
import json

db_path = "centleos.db"

def extract():
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    report = ""

    def write_section(title, query):
        nonlocal report
        try:
            cursor.execute(query)
            rows = [dict(row) for row in cursor.fetchall()]
            report += f"### {title}\\n```json\\n{json.dumps(rows, indent=2)}\\n```\\n\\n"
        except Exception as e:
            report += f"### {title}\\n```text\\nError: {str(e)}\\n```\\n\\n"

    write_section("Users in DB", "SELECT id, email, is_active FROM users LIMIT 2")
    write_section("Leads in DB", "SELECT id, name, stage FROM leads LIMIT 2")
    write_section("Invoices in DB", "SELECT id, invoice_number, status, total_amount FROM erp_invoices LIMIT 2")
    write_section("Payouts in DB", "SELECT * FROM referrals LIMIT 2")
    write_section("Deals in DB", "SELECT id, name, amount, stage FROM deals LIMIT 2")
    
    with open("C:\\\\Users\\\\DELL\\\\.gemini\\\\antigravity-ide\\\\brain\\\\b98c687c-315d-48f8-b59d-e05f7c28ec2d\\\\db_evidence.md", "w") as f:
        f.write(report)
    
    print("Extracted DB evidence.")

if __name__ == "__main__":
    extract()
