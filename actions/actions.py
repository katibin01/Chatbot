# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions


import os
import requests
from typing import Dict, List, Text, Any
from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import SlotSet, Restarted
import logging

logger = logging.getLogger(__name__)

# Laravel API Configuration
LARAVEL_API_URL = os.getenv("LARAVEL_API_URL", "https://laravel-backend.test/api")
LARAVEL_API_TOKEN = os.getenv("LARAVEL_API_TOKEN", "your-api-token")

class LaravelClient:
    """Handles all Laravel API communications"""
    
    @staticmethod
    def _get_headers():
        return {
            "Authorization": f"Bearer {LARAVEL_API_TOKEN}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
    
    @staticmethod
    def get_alumni_data(nim: str) -> Dict:
        """Fetch alumni data from Laravel"""
        try:
            response = requests.get(
                f"{LARAVEL_API_URL}/alumni/{nim}",
                headers=LaravelClient._get_headers(),
                timeout=10
            )
            response.raise_for_status()
            return response.json().get('data', {})
        except Exception as e:
            logger.error(f"Error fetching alumni data: {str(e)}")
            return {}

    @staticmethod
    def save_conversation_log(chat_data: Dict) -> bool:
        """Save conversation log to Laravel"""
        try:
            response = requests.post(
                f"{LARAVEL_API_URL}/conversation-logs",
                json=chat_data,
                headers=LaravelClient._get_headers(),
                timeout=10
            )
            return response.status_code == 201
        except Exception as e:
            logger.error(f"Error saving conversation log: {str(e)}")
            return False

    @staticmethod
    def get_previous_answers(nim: str, question_code: str) -> Dict:
        """Get previous answers for specific question"""
        try:
            response = requests.get(
                f"{LARAVEL_API_URL}/answers/{nim}/{question_code}",
                headers=LaravelClient._get_headers(),
                timeout=10
            )
            return response.json().get('data', {})
        except Exception as e:
            logger.error(f"Error fetching previous answers: {str(e)}")
            return {}

# Enhanced Actions with Laravel Integration
class ActionFetchAlumniData(Action):
    """Fetches existing alumni data from Laravel"""
    def name(self) -> Text:
        return "action_fetch_alumni_data"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict) -> List[Dict]:
        nim = tracker.get_slot("nim")
        if not nim:
            return []
        
        alumni_data = LaravelClient.get_alumni_data(nim)
        if not alumni_data:
            return []
        
        # Set slots from retrieved data
        slots = []
        for field in ['nama', 'prodi', 'tahun_lulus', 'email', 'phone']:
            if field in alumni_data:
                slots.append(SlotSet(field, alumni_data[field]))
        
        if slots:
            dispatcher.utter_message(text="Data alumni ditemukan. Beberapa field sudah diisi otomatis.")
        
        return slots

class ActionSaveConversationLog(Action):
    """Logs conversation to Laravel backend"""
    def name(self) -> Text:
        return "action_save_conversation_log"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict) -> List[Dict]:
        log_data = {
            "sender_id": tracker.sender_id,
            "nim": tracker.get_slot("nim"),
            "conversation": self._prepare_conversation(tracker),
            "status": "completed" if tracker.active_loop.get("name") == "complete_form" else "in_progress"
        }
        
        if LaravelClient.save_conversation_log(log_data):
            logger.info("Conversation log saved successfully")
        else:
            logger.warning("Failed to save conversation log")
        
        return []
    
    def _prepare_conversation(self, tracker: Tracker) -> List[Dict]:
        """Formats conversation history for logging"""
        return [
            {
                "event": event.get("event"),
                "timestamp": event.get("timestamp"),
                "text": event.get("text"),
                "data": event.get("data", {})
            }
            for event in tracker.events
            if event.get("event") in ["user", "bot"]
        ]

class ActionCheckPreviousAnswers(Action):
    """Checks previous answers to avoid duplicate data entry"""
    def name(self) -> Text:
        return "action_check_previous_answers"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict) -> List[Dict]:
        nim = tracker.get_slot("nim")
        current_question = tracker.get_slot("current_question")
        
        if not nim or not current_question:
            return []
        
        question_code = current_question.replace("utter_ask_", "")
        previous_data = LaravelClient.get_previous_answers(nim, question_code)
        
        if previous_data:
            dispatcher.utter_message(
                text=f"Catatan sebelumnya: {previous_data.get('answer')}\n"
                     f"Silakan perbarui atau ketik 'lewati' untuk mempertahankan jawaban lama."
            )
            return [SlotSet(f"previous_{question_code}", previous_data.get('answer'))]
        
        return []

# Updated Existing Actions with Laravel Integration
class ActionSaveAlumniData(Action):
    """Saves data to both Rasa slots and Laravel backend"""
    def name(self) -> Text:
        return "action_save_alumni_data"
    
    def run(self, dispatcher: CollectingDispatcher, tracker: Tracker, domain: Dict) -> List[Dict]:
        try:
            data = self._prepare_data(tracker)
            response = requests.post(
                f"{LARAVEL_API_URL}/alumni",
                json=data,
                headers=LaravelClient._get_headers(),
                timeout=15
            )
            
            if response.status_code == 201:
                dispatcher.utter_message(text="✅ Data berhasil disimpan di sistem!")
                return [SlotSet("data_saved", True)]
            
            dispatcher.utter_message(text="⚠️ Data gagal disimpan. Silakan coba lagi.")
            return []
            
        except Exception as e:
            logger.error(f"Error saving data: {str(e)}")
            dispatcher.utter_message(text="❌ Terjadi kesalahan sistem saat menyimpan data.")
            return []
    
    def _prepare_data(self, tracker: Tracker) -> Dict:
        """Prepares data for API submission"""
        return {
            "nim": tracker.get_slot("nim"),
            "nama": tracker.get_slot("nama"),
            "prodi": tracker.get_slot("prodi"),
            "status": tracker.get_slot("status"),
            "answers": self._prepare_answers(tracker)
        }
    
    def _prepare_answers(self, tracker: Tracker) -> Dict:
        """Extracts all question answers from slots"""
        return {
            slot: tracker.get_slot(slot)
            for slot in tracker.slots.keys()
            if slot.startswith('answer_') and tracker.get_slot(slot) is not None
        }

# Example usage in domain.yml
"""
responses:
  utter_ask_nim:
    - text: "Masukkan NIM Anda. Kami akan mengecek data yang sudah ada di sistem."
    
  utter_data_found:
    - text: "Kami menemukan data Anda. Beberapa field sudah diisi otomatis."
    
  utter_ask_confirm_previous:
    - text: "Anda sebelumnya menjawab: {previous_answer}\nGunakan jawaban yang sama? (ya/tidak)"
"""

# Example usage in stories.yml
"""
stories:
- story: fetch existing data
  steps:
  - intent: provide_nim
  - action: action_fetch_alumni_data
  - slot_was_set:
    - nama: "John Doe"
  - action: utter_data_found
"""