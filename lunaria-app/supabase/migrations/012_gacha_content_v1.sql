-- lunaria migration 012: 月箱コンテンツ v1
-- 既存 inventory/history の pool_id を壊さないため、既存アイテムは DELETE せず UPDATE する。

-- 既存アイテムのリネーム + 説明更新
update public.lunaria_gacha_pool
   set name = '三日月のろうそく',
       description = '灯すと部屋が少し丸くなる'
 where name = 'ろうそく';

update public.lunaria_gacha_pool
   set name = '月相の振り子時計',
       description = '文字盤に月の満ち欠けが描かれてる'
 where name = 'アンティーク時計';

update public.lunaria_gacha_pool
   set name = '三日月のステンドグラス',
       description = '夕方の光が一番きれいに通る'
 where name = 'ステンドグラス';

update public.lunaria_gacha_pool
   set name = 'うた箱',
       description = 'ふたを開けるとどこか聞き覚えのある旋律'
 where name = 'レコードプレイヤー';

update public.lunaria_gacha_pool
   set name = 'どこかで見たコート',
       description = '赤い、そして煙草の匂いが少しする'
 where name = '千束のコート';

update public.lunaria_gacha_pool
   set name = '逆さの砂時計',
       description = 'ひっくり返すと、砂が上に向かって流れる'
 where name = '星の砂時計';

update public.lunaria_gacha_pool
   set name = '瞬きの猫',
       description = '目を瞬きするたび、瞳の奥に星が見える気がする'
 where name = '宇宙猫';

-- 説明のみ更新
update public.lunaria_gacha_pool
   set description = '月明かりの下でだけ薄く光る'
 where name = '月光のチョーカー';

update public.lunaria_gacha_pool
   set description = '灯すと部屋いっぱいに月の光が広がる'
 where name = '満月のランプ';

update public.lunaria_gacha_pool
   set description = 'インクが少しだけ尾を引いて乾く'
 where name = '流星の万年筆';

update public.lunaria_gacha_pool
   set description = '中に小さな星が閉じ込められているような'
 where name = '深海の真珠';

-- urban_legend 追加。合計出現率 0.1% の中で均等抽選するため drop_weight は既定値 1 のまま。
insert into public.lunaria_gacha_pool (name, rarity, category, image_url, description) values
  ('月の欠片',         'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '持っていると夜が少し明るく感じる'),
  ('二度目のメガネ',   'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', 'かけると、忘れていた小さなことだけ思い出す'),
  ('影のない傘',       'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '雨の中で広げても、地面に影が落ちない'),
  ('からっぽの封筒',   'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '重みはあるのに、中身は誰にも開けられない'),
  ('砂浜のラジオ',     'urban_legend', 'urban_legend', '/img/gacha/placeholder.png', '一度だけ、知らない誰かの声が流れたことがある')
on conflict (name) do nothing;

-- 確認用:
-- select name, rarity, description from public.lunaria_gacha_pool where rarity = 'urban_legend' order by name;
