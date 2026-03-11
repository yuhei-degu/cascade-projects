"use client"
// src/components/lab/SqlInjectionLab.tsx — TASK-019
import { useState } from "react"
import { Database, ShieldCheck, ShieldX } from "lucide-react"

// 疑似DBレコード
const FAKE_DB = [
  { id: 1, username: "admin",   role: "administrator" },
  { id: 2, username: "alice",   role: "user" },
  { id: 3, username: "bob",     role: "user" },
]
const SECRET = { id: 0, username: "system", password: "P@ssw0rd!", role: "root" }

type Mode = "vulnerable" | "safe"

function vulnerableQuery(input: string): { sql: string; result: object[]; leaked: boolean } {
  const sql = `SELECT * FROM users WHERE username = '${input}'`
  // SQLi シミュレーション
  if (input.includes("' OR '1'='1") || input.includes("' OR 1=1")) {
    return { sql, result: [...FAKE_DB, SECRET], leaked: true }
  }
  if (input.includes("--") || input.includes("'; DROP")) {
    return { sql, result: [], leaked: true }
  }
  const found = FAKE_DB.filter(u => u.username === input)
  return { sql, result: found, leaked: false }
}

function safeQuery(input: string): { sql: string; result: object[]; leaked: boolean } {
  const sql = `SELECT * FROM users WHERE username = $1  -- パラメータ: "${input}"`
  const found = FAKE_DB.filter(u => u.username === input)
  return { sql, result: found, leaked: false }
}

const ATTACKS = [
  { label: "基本的なOR注入",   value: "' OR '1'='1" },
  { label: "コメントアウト型", value: "admin'--" },
  { label: "DROP TABLE型",    value: "'; DROP TABLE users;--" },
]

export function SqlInjectionLab() {
  const [mode, setMode]   = useState<Mode>("vulnerable")
  const [input, setInput] = useState("")
  const [result, setResult] = useState<ReturnType<typeof vulnerableQuery> | null>(null)

  function execute() {
    if (!input.trim()) return
    setResult(mode === "vulnerable" ? vulnerableQuery(input) : safeQuery(input))
  }

  return (
    <div className="bg-gray-950 rounded-2xl overflow-hidden border border-gray-800">
      {/* ヘッダー */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Database size={16} className="text-green-400" />
          <span className="text-green-400 text-sm font-mono font-bold">SQL Injection Lab</span>
        </div>
        {/* モード切替 */}
        <div className="flex bg-gray-800 rounded-lg p-1 gap-1">
          {(["vulnerable", "safe"] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null) }}
              className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors
                ${mode === m
                  ? m === "vulnerable" ? "bg-red-600 text-white" : "bg-green-600 text-white"
                  : "text-gray-400 hover:text-gray-200"}`}>
              {m === "vulnerable" ? "⚠ 脆弱なコード" : "✅ 安全なコード"}
            </button>
          ))}
        </div>
      </div>

      {/* コード表示 */}
      <div className="px-4 py-3 border-b border-gray-800 font-mono text-xs">
        {mode === "vulnerable" ? (
          <p className="text-red-400">{`// ❌ 危険: 文字列連結でSQLを組み立てている`}</p>
        ) : (
          <p className="text-green-400">{`// ✅ 安全: プリペアドステートメントを使用`}</p>
        )}
        <p className="text-gray-300 mt-1">
          {mode === "vulnerable"
            ? `query("SELECT * FROM users WHERE username = '" + input + "'")`
            : `query("SELECT * FROM users WHERE username = $1", [input])`}
        </p>
      </div>

      {/* 攻撃サンプル */}
      <div className="px-4 py-2 border-b border-gray-800 flex gap-2 flex-wrap">
        {ATTACKS.map(a => (
          <button key={a.label} onClick={() => setInput(a.value)}
            className="text-xs bg-gray-800 hover:bg-gray-700 text-orange-400 px-2 py-1 rounded border border-orange-900/40">
            ⚠ {a.label}
          </button>
        ))}
      </div>

      {/* 入力 */}
      <div className="px-4 py-3 border-b border-gray-800 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && execute()}
          placeholder="username を入力（例: admin  または 攻撃文字列）"
          className="flex-1 bg-gray-900 text-gray-200 text-sm rounded-lg px-3 py-2 border border-gray-700 focus:outline-none focus:border-green-500 font-mono" />
        <button onClick={execute}
          className="bg-green-600 hover:bg-green-500 text-white text-sm font-bold px-4 rounded-lg">
          実行
        </button>
      </div>

      {/* 結果 */}
      {result && (
        <div className="p-4 space-y-3">
          <div className="bg-gray-900 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-1">実行されたSQL:</p>
            <p className="font-mono text-xs text-yellow-300 break-all">{result.sql}</p>
          </div>
          <div className={`rounded-lg p-3 ${result.leaked ? "bg-red-900/30 border border-red-700" : "bg-gray-900"}`}>
            <div className="flex items-center gap-2 mb-2">
              {result.leaked
                ? <><ShieldX size={16} className="text-red-400" /><span className="text-red-400 text-xs font-bold">⚠ 情報漏洩発生！</span></>
                : <><ShieldCheck size={16} className="text-green-400" /><span className="text-green-400 text-xs font-bold">安全</span></>}
            </div>
            <pre className="font-mono text-xs text-gray-300 overflow-x-auto">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
