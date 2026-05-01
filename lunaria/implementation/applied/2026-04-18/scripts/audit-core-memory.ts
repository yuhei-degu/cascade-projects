// =============================================================
// 🚫 DEPRECATED（2026-04-18 破棄）
// =============================================================
// 当初 profile と substring 一致する core_memory を洗い出す棚卸
// スクリプトだったが、Phase A で既存 `memory_category='profile'`
// マーカーが既に機能していることが判明し、棚卸は不要になった
// （「profile」マーカー付き 2 行のみが対象で、直接クリーンアップすれば済む）。
//
// 新プランでは手動 SQL で 2 行をクリーンアップする：
//   implementation/scripts/cleanup_profile_duplicates.sql
//
// このファイルは実行しないこと。新プランは
// PROFILE_MEMORY_INTEGRATION.md v2 を参照。
// =============================================================

throw new Error('This script is deprecated. See cleanup_profile_duplicates.sql instead.')
