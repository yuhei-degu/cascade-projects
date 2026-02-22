# 📝 実装メモ — 酔い止め照準器アプリ

## 初心者向け学習ポイント 🎓

### なぜHTMLファイルだけで動くの？
HTMLはブラウザが直接読める言語。サーバーやインストールが不要なのが強み！

### CSS変数（カスタムプロパティ）とは？
```css
:root {
  --reticle-color: red;  /* 変数の定義 */
}
.reticle {
  color: var(--reticle-color);  /* 変数の使用 */
}
```
JavaScriptから `document.documentElement.style.setProperty('--reticle-color', 'blue')` で動的変更できる！

### SVGで図形を描く
```html
<svg width="40" height="40">
  <!-- 横線 -->
  <line x1="0" y1="20" x2="40" y2="20" stroke="red" stroke-width="2"/>
  <!-- 縦線 -->  
  <line x1="20" y1="0" x2="20" y2="40" stroke="red" stroke-width="2"/>
</svg>
```

---

## 実装TODO

- [ ] 照準器コンポーネントをJSクラス化
- [ ] localStorageへの自動保存
- [ ] キーボードショートカット（F1で表示切替）
- [ ] モバイル対応（タッチ操作）

---

## 既知の問題・メモ
- `minimal-overlay.html` は最もシンプルな動作確認用
- `my-code.html` は実験・テスト用（本番には使わない）
