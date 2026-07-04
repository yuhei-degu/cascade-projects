"use client"
// src/components/layout/SidebarContext.tsx
import { createContext, useContext, useEffect, useState } from "react"

interface SidebarContextType {
  open: boolean
  toggle: () => void
  close: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  open: true,
  toggle: () => {},
  close: () => {},
})

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)")
    const syncSidebar = () => setOpen(query.matches)
    syncSidebar()
    query.addEventListener("change", syncSidebar)
    return () => query.removeEventListener("change", syncSidebar)
  }, [])

  return (
    <SidebarContext.Provider value={{ open, toggle: () => setOpen(o => !o), close: () => setOpen(false) }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return useContext(SidebarContext)
}
