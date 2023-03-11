import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default {
  base: './',
  plugins: [react(),
    basicSsl()
  ]
}