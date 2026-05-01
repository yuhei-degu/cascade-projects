const https = require('https')
const fs = require('fs')
const key = fs.readFileSync('.env.local','utf8').match(/GEMINI_API_KEY=(.+)/)[1].trim()

const options = {
  hostname: 'generativelanguage.googleapis.com',
  path: `/v1beta/models?key=${key}`,
  method: 'GET',
}

const req = https.request(options, res => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    const models = JSON.parse(data).models || []
    const flash = models.filter(m => m.name.includes('flash'))
    flash.forEach(m => console.log(m.name, '-', m.supportedGenerationMethods?.join(',')))
  })
})
req.on('error', e => console.log('ERROR:', e.message))
req.end()
