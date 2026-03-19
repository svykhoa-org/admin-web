const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL as string,
  APP_TITLE: import.meta.env.VITE_APP_TITLE as string,
  API_KEY: import.meta.env.VITE_API_KEY as string,
} as const

export default ENV
