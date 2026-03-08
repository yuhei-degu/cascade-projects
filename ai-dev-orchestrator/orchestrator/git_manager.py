"""
orchestrator/git_manager.py
Git操作の自動化（commit / 履歴参照 / ブランチ管理）
"""

import subprocess
import os
from datetime import datetime
from pathlib import Path


class GitManager:
    def __init__(self, project_dir: Path):
        self.project_dir = project_dir

    def _run(self, *args, check=True) -> subprocess.CompletedProcess:
        return subprocess.run(
            ["git"] + list(args),
            capture_output=True, text=True,
            cwd=self.project_dir, check=check
        )

    def init(self):
        """リポジトリ初期化（まだの場合）"""
        git_dir = self.project_dir / ".git"
        if not git_dir.exists():
            self._run("init")
            self._run("checkout", "-b", "main", check=False)
        return self

    def add_all(self):
        self._run("add", "-A")

    def commit(self, message: str, agent: str = "AI-ORCHESTRATOR") -> str:
        """ステージング → コミット。コミットハッシュを返す"""
        self.add_all()
        ts = datetime.now().strftime("%Y-%m-%d %H:%M")
        full_msg = f"[{agent}] {message}\n\nAuto-committed at {ts}"
        result = self._run("commit", "-m", full_msg, check=False)
        if result.returncode != 0:
            if "nothing to commit" in result.stdout:
                return "nothing_to_commit"
            return f"error: {result.stderr}"
        # ハッシュ取得
        hash_result = self._run("rev-parse", "--short", "HEAD", check=False)
        return hash_result.stdout.strip()

    def get_log(self, n: int = 10) -> list[dict]:
        """直近nコミットの履歴を返す"""
        result = self._run(
            "log", f"-{n}", "--pretty=format:%H|%s|%an|%ai", check=False
        )
        logs = []
        for line in result.stdout.strip().split("\n"):
            if not line:
                continue
            parts = line.split("|")
            if len(parts) >= 4:
                logs.append({
                    "hash":    parts[0],
                    "message": parts[1],
                    "author":  parts[2],
                    "date":    parts[3],
                })
        return logs

    def get_diff(self, commit_hash: str = "HEAD~1") -> str:
        """直前コミットとの差分を返す"""
        result = self._run("diff", commit_hash, check=False)
        return result.stdout[:5000]  # 長すぎる場合は切る

    def create_branch(self, branch_name: str):
        self._run("checkout", "-b", branch_name, check=False)

    def get_status(self) -> str:
        result = self._run("status", "--short", check=False)
        return result.stdout

    def tag(self, tag_name: str, message: str = ""):
        self._run("tag", "-a", tag_name, "-m", message or tag_name, check=False)
