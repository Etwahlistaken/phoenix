import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' -> GitHub Pages alt klasöründe de çalışır
export default defineConfig({ base: './', plugins: [react()] })
