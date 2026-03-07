/**
 * プロトタイプ自動生成 — Claude API
 * 依頼内容からコード骨格を生成して「この方向で作れます」と提示
 */

interface PrototypeResult {
  code: string;
  lang: string;
  note: string;
}

export async function generatePrototype(
  title: string,
  description: string,
  category: string,
  estimatedHours: number
): Promise<PrototypeResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return generateFallbackPrototype(title, category);
  }

  const prompt = buildPrototypePrompt(title, description, category, estimatedHours);

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    console.error("Claude API error:", await res.text());
    return generateFallbackPrototype(title, category);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  return parsePrototypeResponse(text, category);
}

// ── プロンプト構築 ─────────────────────────────────────────
function buildPrototypePrompt(
  title: string, desc: string, category: string, hours: number
): string {
  const langHint = {
    script:          "Python スクリプト",
    web_tool:        "HTML/CSS/JavaScript（単一ファイル）",
    api_integration: "Python または JavaScript",
    dashboard:       "HTML + Chart.js",
    website:         "HTML/CSS/JavaScript（単一ファイル）",
    other:           "最適な言語",
  }[category] ?? "最適な言語";

  return `あなたは優秀な個人フリーランス開発者です。
以下の依頼の「試作プロトタイプ（骨格）」を生成してください。

## 依頼
タイトル: ${title}
説明: ${desc}
推奨言語: ${langHint}
想定工数: ${hours}時間

## 出力ルール
1. 動く骨格コードを生成する（完全な仕上げは不要）
2. コメントを日本語で丁寧に書く
3. TODO: でカスタマイズポイントを明示
4. 単一ファイルで完結させる

## 出力形式（必ずこの形式で）
LANG: html または python または js
NOTE: 「この試作では〇〇機能を実装しました。本実装では〇〇を追加します」（1〜3行）
CODE:
\`\`\`
（コードをここに記述）
\`\`\``;
}

// ── レスポンスパース ────────────────────────────────────────
function parsePrototypeResponse(text: string, category: string): PrototypeResult {
  const langMatch = text.match(/LANG:\s*(\w+)/i);
  const noteMatch = text.match(/NOTE:\s*(.+?)(?=CODE:|$)/is);
  const codeMatch = text.match(/CODE:\s*```(?:\w+)?\n([\s\S]+?)```/i);

  return {
    lang: langMatch?.[1]?.toLowerCase() ?? guessLang(category),
    note: noteMatch?.[1]?.trim() ?? "試作プロトタイプを生成しました。",
    code: codeMatch?.[1]?.trim() ?? text,
  };
}

function guessLang(category: string): string {
  if (["web_tool", "website", "dashboard"].includes(category)) return "html";
  if (["script", "api_integration"].includes(category)) return "python";
  return "js";
}

// ── APIキーなし時のフォールバック ──────────────────────────
function generateFallbackPrototype(title: string, category: string): PrototypeResult {
  const isWeb = ["web_tool", "website", "dashboard"].includes(category);
  const lang = isWeb ? "html" : "python";

  const code = isWeb
    ? `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    /* TODO: スタイルをカスタマイズ */
    body { font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #6366f1; }
    .container { background: #f9fafb; border-radius: 8px; padding: 20px; }
    button { background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="container">
    <!-- TODO: メインコンテンツをここに実装 -->
    <p>ここにメインUIを実装します</p>
    <button onclick="main()">実行</button>
    <div id="result"></div>
  </div>
  <script>
    // TODO: メイン処理を実装
    function main() {
      document.getElementById('result').textContent = '処理結果がここに表示されます';
    }
  </script>
</body>
</html>`
    : `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
${title}
TODO: スクリプトの説明を追記
"""

# TODO: 必要なライブラリをインポート
# import pandas as pd
# import requests

def main():
    """メイン処理"""
    print("=== ${title} ===")
    
    # TODO: 入力データの取得・読み込み
    input_data = get_input()
    
    # TODO: メイン処理
    result = process(input_data)
    
    # TODO: 結果の出力・保存
    output(result)

def get_input():
    """入力データ取得"""
    # TODO: ファイル読み込み or API取得 を実装
    return {}

def process(data):
    """メイン処理ロジック"""
    # TODO: 実際の処理を実装
    return data

def output(result):
    """結果出力"""
    # TODO: ファイル保存 or 画面表示 を実装
    print(result)

if __name__ == "__main__":
    main()`;

  return {
    lang,
    code,
    note: `この試作では${title}の基本骨格を生成しました。本実装ではご要件に合わせて詳細を実装します。`,
  };
}
