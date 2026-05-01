const OpenAI = require('openai')
const fs = require('fs')
const key = fs.readFileSync('.env.local','utf8').match(/GEMINI_API_KEY=(.+)/)[1].trim()

const g = new OpenAI({
  apiKey: key,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/'
})

const models = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-flash-latest']

async function test() {
  for (const model of models) {
    try {
      const r = await g.chat.completions.create({
        model, max_tokens: 20,
        messages: [{ role: 'user', content: 'hi' }]
      })
      console.log('OK:', model, '->', r.choices[0].message.content)
      break
    } catch (e) {
      console.log('NG:', model, e.status)
    }
  }
}
test()
