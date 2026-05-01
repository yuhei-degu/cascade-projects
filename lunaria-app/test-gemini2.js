const https = require('https')
const fs = require('fs')
const key = fs.readFileSync('.env.local','utf8').match(/GEMINI_API_KEY=(.+)/)[1].trim()

const body = JSON.stringify({
  model: 'gemini-2.5-flash-preview-04-17',
  messages: [{ role: 'user', content: 'hi' }],
  max_tokens: 10
})

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: '/v1beta/openai/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
    'Content-Length': Buffer.byteLength(body)
  }
}

const req = https.request(options, res => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    console.log('STATUS:', res.statusCode)
    console.log('BODY:', data.slice(0, 300))
  })
})
req.on('error', e => console.log('ERROR:', e.message))
req.write(body)
req.end()
