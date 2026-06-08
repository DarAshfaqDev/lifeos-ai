from typing import Optional, List, Dict, Any
from app.config import settings
import logging

logger = logging.getLogger(__name__)


class AIProvider:
    def __init__(self):
        self.openai_client = None
        self.gemini_client = None
        self.claude_client = None
        self._init_clients()

    def _init_clients(self):
        if settings.OPENAI_API_KEY:
            try:
                from openai import OpenAI
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("OpenAI client initialized")
            except Exception as e:
                logger.warning(f"Failed to init OpenAI: {e}")

        if settings.GEMINI_API_KEY:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.GEMINI_API_KEY)
                self.gemini_client = genai
                logger.info("Gemini client initialized")
            except Exception as e:
                logger.warning(f"Failed to init Gemini: {e}")

        if settings.CLAUDE_API_KEY:
            try:
                from anthropic import Anthropic
                self.claude_client = Anthropic(api_key=settings.CLAUDE_API_KEY)
                logger.info("Claude client initialized")
            except Exception as e:
                logger.warning(f"Failed to init Claude: {e}")

    def chat(self, messages: List[Dict[str, str]], model: str = "auto") -> Optional[str]:
        preferred = self._resolve_model(model)
        if preferred == "openai" and self.openai_client:
            return self._chat_openai(messages)
        if preferred == "gemini" and self.gemini_client:
            return self._chat_gemini(messages)
        if preferred == "claude" and self.claude_client:
            return self._chat_claude(messages)
        return self._fallback_chat(messages)

    def _resolve_model(self, model: str) -> str:
        if model == "auto":
            if self.openai_client:
                return "openai"
            if self.gemini_client:
                return "gemini"
            if self.claude_client:
                return "claude"
        return model

    def _chat_openai(self, messages: List[Dict[str, str]]) -> Optional[str]:
        try:
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",
                messages=messages,
                max_tokens=2048,
                temperature=0.7,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI error: {e}")
            return None

    def _chat_gemini(self, messages: List[Dict[str, str]]) -> Optional[str]:
        try:
            model = self.gemini_client.GenerativeModel("gemini-2.5-flash")
            prompt = "\n".join([f"{m['role']}: {m['content']}" for m in messages])
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini error: {e}")
            return None

    def _chat_claude(self, messages: List[Dict[str, str]]) -> Optional[str]:
        try:
            system_msg = None
            chat_messages = []
            for m in messages:
                if m["role"] == "system" and not system_msg:
                    system_msg = m["content"]
                else:
                    chat_messages.append({"role": m["role"], "content": m["content"]})
            response = self.claude_client.messages.create(
                model="claude-3-5-sonnet-20241022",
                system=system_msg or "",
                messages=chat_messages,
                max_tokens=2048,
            )
            return response.content[0].text
        except Exception as e:
            logger.error(f"Claude error: {e}")
            return None

    def _fallback_chat(self, messages: List[Dict[str, str]]) -> str:
        return "AI service is not configured. Please set up an API key for OpenAI, Gemini, or Claude."


ai_provider = AIProvider()
