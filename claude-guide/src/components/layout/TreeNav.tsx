"use client"
// src/components/layout/TreeNav.tsx

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, ChevronDown } from "lucide-react"
import { TREE } from "@/lib/content/tree"
import type { TreeNode } from "@/types"

function NavItem({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(
    // 現在のページが子孫なら自動展開
    node.children?.some((c) => pathname.startsWith(c.href ?? "")) ?? false
  )
  const hasChildren = node.children && node.children.length > 0
  const isActive = pathname === node.href

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-left transition-colors
            ${depth === 0 ? "text-gray-800 hover:bg-gray-100" : "text-gray-600 hover:bg-gray-50"}
          `}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {node.label}
        </button>
      ) : (
        <Link
          href={node.href ?? "#"}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
            ${isActive
              ? "bg-violet-100 text-violet-700 font-semibold"
              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }
          `}
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {node.label}
        </Link>
      )}

      {hasChildren && open && (
        <div>
          {node.children!.map((child) => (
            <NavItem key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeNav() {
  return (
    <nav className="w-64 flex-shrink-0 h-[calc(100vh-56px)] sticky top-14 overflow-y-auto border-r border-gray-100 py-4 px-2">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-3 mb-3">学習メニュー</p>
      <div className="space-y-1">
        {TREE.map((node) => (
          <NavItem key={node.id} node={node} />
        ))}
      </div>
    </nav>
  )
}
