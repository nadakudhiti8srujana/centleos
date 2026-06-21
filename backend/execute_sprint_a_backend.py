import asyncio
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.services.auth_service import AuthService
from app.schemas.auth import ForgotPasswordRequest, ResetPasswordRequest
from app.services.saas_service import SaaSService
from app.schemas.saas import InviteUserRequest
from app.core.enums import UserRole

def main():
    db = SessionLocal()
    try:
        # Find the admin user
        admin = db.query(User).filter(User.company_id.isnot(None)).first()
        if not admin:
            print("No user with company found.")
            return

        print("--- PASSWORD RESET ---")
        # Monkey patch send_email to capture the reset link
        original_send_email = None
        import app.services.email_service as email_service
        original_send_email = email_service.EmailService.send_email

        captured_token = None

        def mocked_send_email(self, company_id, to_email, subject, body_html, body_text="", log_id=None):
            nonlocal captured_token
            # body_html contains the link with token: href="http://localhost:5173/reset-password?token=..."
            if "reset-password?token=" in body_html:
                start = body_html.find("token=") + 6
                end = body_html.find('"', start)
                captured_token = body_html[start:end]
            return None

        email_service.EmailService.send_email = mocked_send_email

        # Trigger Forgot Password
        auth_service = AuthService(db)
        print(f"Requesting forgot password for {admin.email}...")
        auth_service.forgot_password(ForgotPasswordRequest(email=admin.email))

        print(f"Captured Reset Token: {captured_token[:20]}...")

        # Execute Reset Password
        new_password = "NewAdminPassword!23"
        print(f"Resetting password to {new_password}...")
        auth_service.reset_password(ResetPasswordRequest(token=captured_token, new_password=new_password))

        print("Password reset successful.")

        # Test login
        from app.schemas.auth import LoginRequest
        try:
            auth_service.login(LoginRequest(email=admin.email, password=new_password))
            print("Login with new password SUCCESSFUL.")
        except Exception as e:
            print(f"Login failed: {str(e)}")

        # Restore
        email_service.EmailService.send_email = original_send_email

        print("\\n--- INVITE USER ---")
        saas_service = SaaSService(db)
        invite_email = "new_invited_user@example.com"
        req = InviteUserRequest(email=invite_email, role=UserRole.SALES_REPRESENTATIVE)
        
        # Monkeypatch again
        captured_invite_code = None
        def mocked_send_invite(self, company_id, to_email, subject, body_html, body_text="", log_id=None):
            nonlocal captured_invite_code
            if "join?code=" in body_html:
                start = body_html.find("code=") + 5
                end = body_html.find('"', start)
                captured_invite_code = body_html[start:end]
            return None
        
        email_service.EmailService.send_email = mocked_send_invite

        print(f"Inviting {invite_email}...")
        saas_service.invite_user(admin.company_id, admin.id, req)

        print(f"Captured Invite Code: {captured_invite_code}")
        
        # Execute Join
        from app.schemas.saas import JoinWorkspaceRequest
        print("Joining workspace using code...")
        join_req = JoinWorkspaceRequest(
            email=invite_email,
            password="InvitedUserPass123!",
            full_name="Invited User",
            invitation_code=captured_invite_code
        )
        saas_service.join_workspace(join_req)
        print("Join workspace SUCCESSFUL.")

        new_user = db.query(User).filter(User.email == invite_email).first()
        print(f"New User DB Record: ID={new_user.id}, CompanyID={new_user.company_id}, Role={new_user.role}")

    finally:
        db.close()

if __name__ == "__main__":
    main()
