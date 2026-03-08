// src/types/index.ts

export type OS = "windows" | "mac" | "linux"
export type StepStatus = "not_started" | "in_progress" | "done"
export type ErrorCategory = "path" | "permission" | "network" | "api_key" | "install" | "other"

export interface StepMeta {
  id: string
  title: string
  description: string
  os: OS[]
  estimatedMinutes: number
  order: number
  category: string
}

export interface TreeNode {
  id: string
  label: string
  icon?: string
  href?: string
  children?: TreeNode[]
}

export interface ErrorPattern {
  pattern: RegExp
  category: ErrorCategory
  cause: string
  solution: string
  guideUrl?: string
}

export interface PromptTemplate {
  id: string
  label: string
  icon: string
  description: string
  template: string
  questions: string[]
}

export interface CheckItem {
  id: string
  label: string
  description: string
  command?: string
  successPattern?: RegExp
  type?: "auto" | "manual"
  failGuide: string
}
