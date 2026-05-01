const NAME_PATTERNS = [
  /(?:俺|私|僕|自分)(?:は|の名前は|って)[\s]*([^\s。、！？]{1,8})(?:って|と|です|だ|という|ていう)/,
  /名前は[\s]*([^\s。、！？]{1,8})(?:です|だ|って|ね|よ)/,
  /([^\s。、！？]{1,8})って(?:名前|いう名前)/,
  /([^\s。、！？]{2,6})(?:という名前|って名前|っていう名前)/,
]

const tests = [
  '悠平って名前ね俺',
  '俺の名前は悠平だ',
  '悠平っていう名前なんだ',
  '名前は悠平ね',
]

for (const msg of tests) {
  let found = null
  for (const p of NAME_PATTERNS) {
    const m = msg.match(p)
    if (m?.[1]) { found = m[1]; break }
  }
  console.log(msg, '->', found ?? 'NO MATCH')
}
