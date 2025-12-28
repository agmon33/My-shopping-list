import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, (process as any).cwd(), '');
  
  // Logic for Deployment:
  // Check system process.env first (for Vercel/Netlify dashboard settings), 
  // then fallback to local .env file
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    define: {
      // This ensures process.env.API_KEY is replaced with the actual value during build
      'process.env.API_KEY': JSON.stringify(apiKey)
    }
  }
})