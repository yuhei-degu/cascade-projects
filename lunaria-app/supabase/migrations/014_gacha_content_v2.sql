-- lunaria migration 014: 月箱コンテンツ v2
--
-- Source of truth:
--   lunaria/MOONBOX_V2_FINAL_REVIEW.md
--
-- Existing inventory/history rows reference lunaria_gacha_pool.id, so existing
-- items must be updated in place. Do not delete and recreate existing pool rows.

-- ── 1. 既存アイテムのリネーム + 説明更新 ───────────────────────
update public.lunaria_gacha_pool
   set name = '月見クッション',
       description = 'ぼーっとする時間にちょうどいい'
 where name = 'やわらかいクッション';

update public.lunaria_gacha_pool
   set name = '表紙の取れた本',
       description = '最初のページに誰かのサインがある'
 where name = '古い本';

update public.lunaria_gacha_pool
   set name = '光の雫ペンダント',
       description = '角度を変えると虹色に折れる'
 where name = '水晶のペンダント';

update public.lunaria_gacha_pool
   set name = '名前のないコイン',
       description = '片面だけに紋章が彫られている'
 where name = '古代風コイン';

update public.lunaria_gacha_pool
   set name = '誰かのリング',
       description = '指に通すとほんのり暖かいらしい'
 where name = '指輪';

update public.lunaria_gacha_pool
   set name = '無音の鈴',
       description = '振ると音はしないけど、静けさが返ってくるらしい'
 where name = '満月の鈴';

-- ── 2. 既存アイテムの説明のみ更新 ─────────────────────────────
update public.lunaria_gacha_pool
   set description = 'ふたりで座るには少し狭い'
 where name = '木の小さな椅子';

update public.lunaria_gacha_pool
   set description = '中ほどのページに挟まっていた'
 where name = '革のしおり';

update public.lunaria_gacha_pool
   set description = 'サイズはちょうどいい'
 where name = '銀のリング';

update public.lunaria_gacha_pool
   set description = 'すみっこに小さな「L」の刺繍がある'
 where name = '刺繍ハンカチ';

-- ── 3. common_a 追加（5 → 8）────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, drop_weight, image_url, description) values
  ('木の小箱',       'common_a', 'small_item', 1, '/img/gacha/placeholder.png', '中身は空っぽなのに、持っているだけで落ち着く'),
  ('朝の湯のみ',     'common_a', 'small_item', 1, '/img/gacha/placeholder.png', '縁が少し欠けている、温かい飲み物が似合う'),
  ('古いマッチ箱',   'common_a', 'small_item', 1, '/img/gacha/placeholder.png', '振ると、中で乾いた音がする')
on conflict (name) do nothing;

-- ── 4. common_b 追加（5 → 7）────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, drop_weight, image_url, description) values
  ('空色のリボン',         'common_b', 'accessory', 1, '/img/gacha/placeholder.png', '結ぶと、結び目が少しだけ大きくなる'),
  ('細紐のブレスレット',   'common_b', 'accessory', 1, '/img/gacha/placeholder.png', '革紐に小さなビーズが一つだけついている')
on conflict (name) do nothing;

-- ── 5. epic 追加（2 → 3）────────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, drop_weight, image_url, description) values
  ('月夜の鏡', 'epic', 'small_item', 1, '/img/gacha/placeholder.png', '月のある夜だけ、縁取りが淡く光る')
on conflict (name) do nothing;

-- ── 6. urban_legend 追加（10 → 15）──────────────────────────
-- 合計出現率 0.1% の中で均等抽選するため、drop_weight はすべて 1。
insert into public.lunaria_gacha_pool (name, rarity, category, drop_weight, image_url, description) values
  ('名のない地図',           'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', '描かれた町の名前だけが、すべて空白になっているらしい'),
  ('古いカメラ',             'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', 'フィルムはないのに、撮るとシャッター音だけ残るらしい'),
  ('鏡うつしの本',           'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', '鏡越しに開くと、読んだ覚えのない一行が浮かぶらしい'),
  ('月光のティーポット',     'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', 'お湯を注ぐと、湯気が三日月の形になるという'),
  ('ふたりの傘',             'urban_legend', 'urban_legend', 1, '/img/gacha/placeholder.png', '一人で差すと、内側だけ雨音が近くなるらしい')
on conflict (name) do nothing;

-- ── 確認用 ─────────────────────────────────────────────────
-- select rarity, count(*) as items
--   from public.lunaria_gacha_pool
--  where is_active
--  group by rarity
--  order by rarity;
--
-- Expected active pool after applying v2:
--   common_a=8, common_b=7, rare_a=3, rare_b=3,
--   epic=3, legendary=2, urban_legend=15, total=41
