-- lunaria migration 010: ガチャ排出物プレースホルダー（Phase G MVP）
-- Supabase SQL Editor にそのまま貼り付けて Run
--
-- 25 アイテムを 7 段階のレアリティに振り分けたプレースホルダー。
-- 実素材ができたら image_url を更新するか、別行に置き換えていく想定。
-- 同じ name は登録されない（009 の unique index と on conflict で再実行可能）。

-- 既に同名アイテムが投入されている場合のクリーンアップ用（任意）
-- delete from public.lunaria_gacha_pool where name in (
--   'やわらかいクッション','木の小さな椅子','花瓶','古い本','ろうそく',
--   '貝殻のブローチ','革のしおり','銀のリング','水晶のペンダント','刺繍ハンカチ',
--   'アンティーク時計','ステンドグラス','北欧チェア','レコードプレイヤー','和風行灯',
--   '月光のチョーカー','虹色イヤリング','古代風コイン','深海の真珠',
--   '満月のランプ','流星の万年筆',
--   '記憶の鈴','黄昏のオルゴール',
--   '指輪','満月の鈴','千束のコート','星の砂時計','宇宙猫'
-- );

-- ── common_a（45%）：ささやかな家具・小物 5 種 ────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('やわらかいクッション', 'common_a', 'furniture',  '/img/gacha/placeholder.png', 'ふわふわで居心地いい'),
  ('木の小さな椅子',       'common_a', 'furniture',  '/img/gacha/placeholder.png', '手作り感のある一脚'),
  ('花瓶',                 'common_a', 'small_item', '/img/gacha/placeholder.png', '陶器の素朴な花瓶'),
  ('古い本',               'common_a', 'small_item', '/img/gacha/placeholder.png', 'タイトルは読めない'),
  ('ろうそく',             'common_a', 'small_item', '/img/gacha/placeholder.png', '揺らめく炎を眺める用')
on conflict (name) do nothing;

-- ── common_b（30%）：ふつうのアクセサリー 5 種 ────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('貝殻のブローチ',   'common_b', 'accessory', '/img/gacha/placeholder.png', '海辺で拾ったような'),
  ('革のしおり',       'common_b', 'accessory', '/img/gacha/placeholder.png', '本のお供に'),
  ('銀のリング',       'common_b', 'accessory', '/img/gacha/placeholder.png', 'シンプルな銀の輪っか'),
  ('水晶のペンダント', 'common_b', 'accessory', '/img/gacha/placeholder.png', '光を透かす'),
  ('刺繍ハンカチ',     'common_b', 'accessory', '/img/gacha/placeholder.png', '小花のモチーフ')
on conflict (name) do nothing;

-- ── rare_a（14%）：レア家具 3 種 ──────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('アンティーク時計', 'rare_a', 'furniture',  '/img/gacha/placeholder.png', '時を刻み続ける'),
  ('ステンドグラス',   'rare_a', 'furniture',  '/img/gacha/placeholder.png', '光が色とりどりに'),
  ('北欧チェア',       'rare_a', 'furniture',  '/img/gacha/placeholder.png', '木目が美しい')
on conflict (name) do nothing;

-- ── rare_b（7%）：レアアクセサリー 3 種 ───────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('月光のチョーカー', 'rare_b', 'accessory', '/img/gacha/placeholder.png', '夜にだけ輝くという'),
  ('虹色イヤリング',   'rare_b', 'accessory', '/img/gacha/placeholder.png', '見る角度で色が変わる'),
  ('古代風コイン',     'rare_b', 'accessory', '/img/gacha/placeholder.png', '由来は不明')
on conflict (name) do nothing;

-- ── epic（3%）：上位レア 2 種 ─────────────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('深海の真珠',       'epic', 'small_item', '/img/gacha/placeholder.png', '深い青の輝き'),
  ('レコードプレイヤー','epic','furniture',  '/img/gacha/placeholder.png', 'まだ動く')
on conflict (name) do nothing;

-- ── legendary（0.9%）：最高レア 2 種 ──────────────────────────────
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('満月のランプ',   'legendary', 'furniture', '/img/gacha/placeholder.png', '夜の部屋を満たす'),
  ('流星の万年筆',   'legendary', 'small_item','/img/gacha/placeholder.png', '書くと尾を引く')
on conflict (name) do nothing;

-- ── urban_legend（0.1%）：都市伝説枠 5 種シャッフル ───────────────
-- 個々の出現率は均等（drop_weight = 1）。トータル 0.1% 内で 5 種が等確率。
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('指輪',           'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '誰かを待つように'),
  ('満月の鈴',       'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '振っても音が出ない'),
  ('千束のコート',   'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', 'どこかで見たような'),
  ('星の砂時計',     'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '逆さにすると…？'),
  ('宇宙猫',         'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '時々瞬く')
on conflict (name) do nothing;

-- ── 確認用 ────────────────────────────────────────────────────────
-- select rarity, count(*) as items from public.lunaria_gacha_pool
--   where is_active group by rarity order by rarity;
