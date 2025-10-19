interface Env {
  ASSETS: {
    fetch: (request: Request) => Promise<Response>
  }
  PT_GEN_STORE?: {
    put: (key: string, value: string, options?: { expirationTtl: number }) => Promise<void>
  }
  SAVE_API_URL?: string
  SAVE_API_TOKEN?: string
  DOUBAN_COOKIE?: string
}
