import os
import ssl
import requests
import logging
import smtplib
from email import encoders
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from typing import Dict, List, Text, Any
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, Restarted, AllSlotsReset

logger = logging.getLogger(__name__)

LARAVEL_API_URL = os.getenv("LARAVEL_API_URL")
LARAVEL_API_TOKEN = os.getenv("LARAVEL_API_TOKEN")

class LaravelClient:
    @staticmethod
    def _headers():
        return {
            "Authorization": f"Bearer {LARAVEL_API_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    @staticmethod
    def get_alumni(nim: str) -> Dict:
        try:
            resp = requests.get(f"{LARAVEL_API_URL}/alumni/{nim}", headers=LaravelClient._headers(), timeout=10)
            resp.raise_for_status()
            return resp.json().get("data", {})
        except Exception as e:
            logger.error("Fetch alumni: %s", e)
            return {}

    @staticmethod
    def save_log(log: Dict) -> bool:
        try:
            resp = requests.post(f"{LARAVEL_API_URL}/conversation-logs", json=log, headers=LaravelClient._headers(), timeout=10)
            return resp.status_code == 201
        except Exception as e:
            logger.error("Save log: %s", e)
            return False

class ActionFetchAlumniData(Action):
    def name(self) -> Text:
        return "action_fetch_alumni_data"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict[Text, Any]) -> List:
        nim = tracker.get_slot("nim_mahasiswa")
        if not nim:
            dispatcher.utter_message(text="Masukkan terlebih dahulu NIM Anda.")
            return []
        data = LaravelClient.get_alumni(nim)
        events = []
        if data:
            dispatcher.utter_message(text="📌 Data ditemukan, beberapa field telah diisi.")
            for key in ["nama_lengkap", "email", "tahun_lulus"]:
                if data.get(key):
                    events.append(SlotSet(key, data.get(key)))
        return events

class ActionCheckPrevious(Action):
    def name(self) -> Text:
        return "action_check_previous_answers"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict) -> List:
        nim = tracker.get_slot("nim_mahasiswa")
        current = tracker.get_slot("current_question")
        if nim and current:
            prev = LaravelClient.get_previous_answers(nim, current)
            if prev:
                dispatcher.utter_message(text=f"Jawaban sebelumnya: {prev.get('answer')}\nKetik 'lewati' untuk menggunakan jawaban lama.")
                return [SlotSet(f"previous_{current}", prev.get("answer"))]
        return []

class ActionSaveAlumniData(Action):
    def name(self) -> Text:
        return "action_save_alumni_data"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict) -> List:
        payload = {slot: tracker.get_slot(slot) for slot in tracker.slots}
        try:
            resp = requests.post(f"{LARAVEL_API_URL}/alumni", json=payload, headers=LaravelClient._headers(), timeout=15)
            if resp.status_code in [200, 201]:
                dispatcher.utter_message(text="✅ Data berhasil disimpan!")
                return [SlotSet("data_saved", True)]
            else:
                dispatcher.utter_message(text="⚠️ Gagal menyimpan data.")
        except Exception as e:
            logger.exception("Error saving alumni data:")
            dispatcher.utter_message(text="❌ Kesalahan sistem saat menyimpan data.")
        return []

class ActionSaveConversationLog(Action):
    def name(self) -> Text:
        return "action_save_conversation_log"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict) -> List:
        log = {
            "sender_id": tracker.sender_id,
            "nim": tracker.get_slot("nim_mahasiswa"),
            "conversation": [
                {"event": ev.get("event"), "text": ev.get("text"), "timestamp": ev.get("timestamp")}
                for ev in tracker.events if ev.get("event") in ["user", "bot"]
            ],
            "status": "completed" if tracker.get_slot("data_saved") else "in_progress"
        }
        success = LaravelClient.save_log(log)
        logger.info("Saved conversation log: %s", success)
        return []
    
class ActionSendEmail(Action):
    def name(self) -> Text:
        return "action_send_email"

    def run(
        self,
        dispatcher: CollectingDispatcher,
        tracker: Tracker,
        domain: Dict[Text, Any],
    ) -> List[Dict[Text, Any]]:
        recipient = tracker.get_slot("email_to_send")
        file_path = tracker.get_slot("laporan_path")
        if not recipient or not file_path or not os.path.exists(file_path):
            dispatcher.utter_message(text="Mohon maaf, terjadi kesalahan saat membuat lampiran.")
            return []

        sender = os.getenv("SMTP_USER")
        password = os.getenv("SMTP_PASS")

        msg = MIMEMultipart()
        msg["Subject"] = "Laporan Tracer Study"
        msg["From"] = sender
        msg["To"] = recipient
        body = (
            "Terima kasih sudah menyelesaikan kuesioner.\n"
            "Laporan kamu sudah saya kirimkan melalui email ini."
        )
        msg.attach(MIMEText(body, "plain"))

        with open(file_path, "rb") as f:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(file_path)}")
        msg.attach(part)

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(sender, password)
            server.sendmail(sender, recipient, msg.as_string())

        dispatcher.utter_message(
            text=f"Akun berkas berhasil dikirim ke {recipient}. Silakan cek inbox/spam ya."
        )
        return []

class ActionRestartIfNeeded(Action):
    def name(self) -> Text:
        return "action_restart"

    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict) -> List:
        dispatcher.utter_message(text="🔄 Mari kita mulai dari awal.")
        return [Restarted(), AllSlotsReset()]
