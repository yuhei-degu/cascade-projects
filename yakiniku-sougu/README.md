# 焼肉ホルモンそうご — セットアップ手順

## 1. ロゴ画像の配置（必須）

ロゴ画像（看板のPNG）を以下の場所に置いてください。

```
yakiniku-sougu/
└── public/
    ├── favicon.svg          ← 自動生成済み（タブ・ファビコン用）
    └── images/
        └── sougu-logo.png   ← ★ここに看板のPNGを置く
```

```bash
# フォルダ作成
mkdir -p public/images

# 看板画像をコピー（ファイル名は sougu-logo.png にすること）
cp /path/to/your/logo.png public/images/sougu-logo.png
```

## 2. インストール＆起動

```bash
npm install
npm run dev
# → http://localhost:3000 で確認
```

## 3. Vercelデプロイ

```bash
git add .
git commit -m "add logo image"
git push
```

Vercelのダッシュボードで自動デプロイされます。

---

## 差し替えポイント一覧

| 内容 | ファイル | 変更箇所 |
|------|----------|---------|
| 看板ロゴ画像 | `public/images/sougu-logo.png` | ファイルを差し替え |
| ファビコン（牛マーク） | `public/favicon.svg` | SVGを編集 |
| キャッチコピー | `src/components/Hero.tsx` | 文字列を変更 |
| 電話番号 | `Hero.tsx` / `Footer.tsx` | PHONE定数 |
| コンセプト文 | `src/components/Concept.tsx` | LINES配列 |
| メニュー | `src/components/Menu.tsx` | ITEMS配列 |
| 営業時間・住所 | `src/components/Access.tsx` | INFO定数 |
| Googleマップ | `src/components/Access.tsx` | MAP_SRC定数 |
| Instagram URL | `src/components/Footer.tsx` | INSTAGRAM_URL定数 |
| 店内写真 | `src/components/Gallery.tsx` | PHOTOS配列のsrc |
