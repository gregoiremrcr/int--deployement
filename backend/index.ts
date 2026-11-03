import 'dotenv/config'
import { serve } from '@hono/node-server'
import { app } from './app'

serve({
  fetch: app.fetch,
  hostname: process.env.API_HOST ?? '0.0.0.0',
  port: Number(process.env.API_PORT ?? process.env.PORT ?? 8787),
})
