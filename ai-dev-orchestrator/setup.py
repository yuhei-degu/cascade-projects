# setup.py — ai-dev コマンドをインストール可能にする
from setuptools import setup, find_packages

setup(
    name="ai-dev-orchestrator",
    version="1.0.0",
    description="AIが24時間自動開発するオーケストレーター",
    packages=find_packages(),
    python_requires=">=3.10",
    install_requires=[
        "anthropic>=0.39.0",
        "click>=8.1.0",
    ],
    entry_points={
        "console_scripts": [
            "ai-dev=cli.main:main",
        ],
    },
)
