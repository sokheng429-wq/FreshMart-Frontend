/**
 * Start an ngrok tunnel to the Vite dev server so Telegram's Login Widget has a
 * real HTTPS origin to authenticate against (Telegram rejects localhost).
 *
 * Usage:
 *   set NGROK_AUTHTOKEN=<your token>   (Windows) / export NGROK_AUTHTOKEN=<...> (macOS/Linux)
 *   npm run tunnel                      (or: node ngrok-tunnel.mjs)
 *
 * Get an authtoken from https://dashboard.ngrok.com/authtokens (free account).
 * The printed URL is what you give the bot: in Telegram, message @BotFather:
 *   /setdomain  <your-url>.ngrok-free.app
 * NOTE: free ngrok URLs change on every restart — re-run /setdomain each time.
 */
import ngrok from '@ngrok/ngrok'

const authtoken = process.env.NGROK_AUTHTOKEN
if (!authtoken) {
  console.error('NGROK_AUTHTOKEN is not set. Get one from https://dashboard.ngrok.com/authtokens')
  process.exit(1)
}

const listener = await ngrok.connect({
  addr: 'http://localhost:5173',
  authtoken,
})

console.log('\nTunnel URL:', listener.url())
console.log('Give this exact URL to @BotFather via /setdomain (without "https://").')
console.log('Then open the URL in your browser and test Telegram login.')
console.log('Press Ctrl+C to stop the tunnel.\n')

// Keep the process alive so the ngrok agent stays connected — without this,
// node exits right after connect() and the tunnel immediately goes offline.
const keepAlive = setInterval(() => {}, 1 << 30)

const shutdown = async () => {
  clearInterval(keepAlive)
  await ngrok.disconnect()
  process.exit(0)
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
