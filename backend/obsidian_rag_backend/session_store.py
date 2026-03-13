from __future__ import annotations

import json
from datetime import datetime
from typing import List
from uuid import uuid4

from .models import SessionMessage, VaultPaths


class SessionStore:
    def __init__(self, vault_paths: VaultPaths):
        self.vault_paths = vault_paths

    def load_active(self) -> tuple[str, List[SessionMessage]]:
        if not self.vault_paths.active_session_path.exists():
            session_id = uuid4().hex
            return session_id, []
        data = json.loads(self.vault_paths.active_session_path.read_text(encoding="utf-8"))
        messages = [SessionMessage(**item) for item in data.get("messages", [])]
        return data.get("session_id", uuid4().hex), messages

    def save_active(self, session_id: str, messages: List[SessionMessage]) -> None:
        payload = {
            "session_id": session_id,
            "updated_at": datetime.now().isoformat(timespec="seconds"),
            "messages": [message.__dict__ for message in messages],
        }
        self.vault_paths.active_session_path.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
        )

    def end_session(self, session_id: str, messages: List[SessionMessage]) -> str:
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        export_path = self.vault_paths.chats_root / f"chat-{timestamp}.md"
        lines = [f"# obsidianRAG Chat {timestamp}", "", f"Session ID: `{session_id}`", ""]
        for message in messages:
            title = "User" if message.role == "user" else "Assistant"
            lines.append(f"## {title}")
            lines.append("")
            if message.thinking:
                lines.append("### Thinking")
                lines.append("")
                lines.append(message.thinking)
                lines.append("")
            lines.append(message.content)
            lines.append("")
            if message.sources:
                lines.append("Sources:")
                for source in message.sources:
                    rel = source.get("relative_path", "unknown")
                    sim = source.get("similarity")
                    if isinstance(sim, float):
                        lines.append(f"- {rel} ({sim:.3f})")
                    else:
                        lines.append(f"- {rel}")
                lines.append("")
        export_path.write_text("\n".join(lines), encoding="utf-8")
        if self.vault_paths.active_session_path.exists():
            self.vault_paths.active_session_path.unlink()
        archive_path = self.vault_paths.sessions_root / f"{session_id}.json"
        archive_path.write_text(
            json.dumps(
                {
                    "session_id": session_id,
                    "messages": [message.__dict__ for message in messages],
                    "exported_path": str(export_path),
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        return str(export_path)
