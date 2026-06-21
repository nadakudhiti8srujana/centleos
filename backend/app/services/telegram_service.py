import logging
import httpx
from typing import Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self):
        self.settings = get_settings()
        self.token = self.settings.TELEGRAM_BOT_TOKEN
        self.chat_id = self.settings.TELEGRAM_CHAT_ID

    def is_configured(self) -> bool:
        return bool(self.token and self.chat_id)

    def send_message(self, message: str) -> bool:
        """
        Sends a message to the configured Telegram chat.
        Fails silently and returns False if not configured or on network error.
        """
        if not self.is_configured():
            logger.debug("Telegram is not configured. Skipping message: %s", message)
            return False

        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": message,
            "parse_mode": "HTML"
        }
        
        try:
            # We use a short timeout so we don't block the API thread for too long
            with httpx.Client(timeout=3.0) as client:
                response = client.post(url, json=payload)
                if response.status_code == 200:
                    return True
                else:
                    logger.warning(f"Failed to send Telegram message. Status: {response.status_code}, Response: {response.text}")
                    return False
        except Exception as e:
            logger.warning(f"Exception while sending Telegram message: {str(e)}")
            return False

    def trigger_lead_assigned(self, lead_name: str, assigned_to: str):
        msg = f"🔔 <b>Lead Assigned</b>\n\nLead <i>{lead_name}</i> has been assigned to <b>{assigned_to}</b>."
        self.send_message(msg)

    def trigger_deal_won(self, deal_name: str, amount: str, owner_name: str):
        msg = f"🎉 <b>Deal Won!</b>\n\nDeal <i>{deal_name}</i> worth <b>${amount}</b> has just been closed by <b>{owner_name}</b>!"
        self.send_message(msg)

    def trigger_invoice_generated(self, invoice_number: str, amount: str, customer_name: str):
        msg = f"🧾 <b>Invoice Generated</b>\n\nInvoice <b>{invoice_number}</b> for <b>${amount}</b> has been generated for <i>{customer_name}</i>."
        self.send_message(msg)

    def trigger_referral_converted(self, ambassador_name: str, commission: str):
        msg = f"💸 <b>Referral Converted!</b>\n\nAmbassador <b>{ambassador_name}</b> just earned a commission of <b>${commission}</b>."
        self.send_message(msg)

    def trigger_payout_approved(self, ambassador_name: str, amount: str):
        msg = f"✅ <b>Payout Approved</b>\n\nA payout of <b>${amount}</b> has been approved for <b>{ambassador_name}</b>."
        self.send_message(msg)
