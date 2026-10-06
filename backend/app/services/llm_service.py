import urllib.request
import json
from typing import Optional, Dict, Any
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.provider = settings.LLM_PROVIDER.lower()
        self.model_name = settings.LLM_MODEL
        self.base_url = settings.LLM_BASE_URL.rstrip('/')

    def is_available(self) -> bool:
        """Check if local Ollama server is running and model is responsive."""
        if self.provider == "ollama":
            try:
                req = urllib.request.Request(f"{self.base_url}/api/tags")
                with urllib.request.urlopen(req, timeout=2) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode('utf-8'))
                        models = [m.get('name') for m in data.get('models', [])]
                        # Return true if base_url responds
                        return True
            except Exception:
                return False
        return False

    def generate_response(self, system_prompt: str, user_prompt: str) -> Optional[str]:
        """
        Generate response using local Ollama model if available.
        If Ollama is unavailable, returns None (caller handles fallback gracefully).
        """
        if self.provider == "ollama" and self.is_available():
            try:
                url = f"{self.base_url}/api/generate"
                payload = {
                    "model": self.model_name,
                    "prompt": f"{system_prompt}\n\nUser Question:\n{user_prompt}",
                    "stream": False,
                    "options": {
                        "temperature": 0.2
                    }
                }
                data_bytes = json.dumps(payload).encode('utf-8')
                req = urllib.request.Request(url, data=data_bytes, headers={'Content-Type': 'application/json'})
                with urllib.request.urlopen(req, timeout=15) as resp:
                    if resp.status == 200:
                        result = json.loads(resp.read().decode('utf-8'))
                        return result.get('response', '').strip()
            except Exception as e:
                print(f"Ollama generation error: {e}")
                return None
        return None

llm_service = LLMService()
