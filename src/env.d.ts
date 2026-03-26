/// <reference types="vite/client" />

interface Window {
  api: {
    invoke: (channel: string, data?: unknown) => Promise<unknown>
    on: (channel: string, callback: (...args: unknown[]) => void) => void
    off: (channel: string, callback: (...args: unknown[]) => void) => void
  }
}
