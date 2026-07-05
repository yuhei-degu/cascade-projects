-- migration 023: RLS hardening audit
--
-- Scope:
--   - Enable RLS on every public Lunaria table known through migration 022.
--   - Replace older broad FOR ALL policies with operation-specific policies.
--   - Use authenticated ownership checks based on (select auth.uid()).
--   - Keep catalog tables read-only to authenticated users.
--   - Keep server-managed gacha/economy audit tables read-only to the owning user;
--     service_role still bypasses RLS for server-side writes.

-- ---------------------------------------------------------------------------
-- Enable RLS on every Lunaria table.
-- ---------------------------------------------------------------------------

alter table public.lunaria_users enable row level security;
alter table public.lunaria_messages enable row level security;
alter table public.lunaria_core_memory enable row level security;
alter table public.lunaria_routing_log enable row level security;
alter table public.lunaria_route_master enable row level security;
alter table public.lunaria_routing_review enable row level security;
alter table public.lunaria_emotion_state enable row level security;
alter table public.lunaria_affinity enable row level security;
alter table public.lunaria_extractions enable row level security;
alter table public.lunaria_diary_logs enable row level security;
alter table public.lunaria_preferences enable row level security;
alter table public.lunaria_relationship_state enable row level security;
alter table public.lunaria_user_profile enable row level security;
alter table public.lunaria_profile_archive enable row level security;
alter table public.lunaria_pending_profile_updates enable row level security;
alter table public.lunaria_gacha_pool enable row level security;
alter table public.lunaria_gacha_tickets enable row level security;
alter table public.lunaria_gacha_coins enable row level security;
alter table public.lunaria_gacha_inventory enable row level security;
alter table public.lunaria_gacha_history enable row level security;
alter table public.lunaria_gacha_daily_bonus enable row level security;
alter table public.lunaria_gacha_daily_quota enable row level security;
alter table public.lunaria_gacha_pity_state enable row level security;
alter table public.lunaria_memory_candidates enable row level security;
alter table public.lunaria_user_items enable row level security;
alter table public.lunaria_character_states enable row level security;

-- ---------------------------------------------------------------------------
-- Drop legacy and replacement policies so the migration is re-runnable.
-- ---------------------------------------------------------------------------

drop policy if exists "lunaria_own_users" on public.lunaria_users;
drop policy if exists "lunaria_users_select_own" on public.lunaria_users;
drop policy if exists "lunaria_users_insert_own" on public.lunaria_users;
drop policy if exists "lunaria_users_update_own" on public.lunaria_users;
drop policy if exists "lunaria_users_delete_own" on public.lunaria_users;

drop policy if exists "lunaria_own_msgs" on public.lunaria_messages;
drop policy if exists "lunaria_messages_select_own" on public.lunaria_messages;
drop policy if exists "lunaria_messages_insert_own" on public.lunaria_messages;
drop policy if exists "lunaria_messages_update_own" on public.lunaria_messages;
drop policy if exists "lunaria_messages_delete_own" on public.lunaria_messages;

drop policy if exists "lunaria_own_mem" on public.lunaria_core_memory;
drop policy if exists "lunaria_core_memory_select_own" on public.lunaria_core_memory;
drop policy if exists "lunaria_core_memory_insert_own" on public.lunaria_core_memory;
drop policy if exists "lunaria_core_memory_update_own" on public.lunaria_core_memory;
drop policy if exists "lunaria_core_memory_delete_own" on public.lunaria_core_memory;

drop policy if exists "lunaria_own_route" on public.lunaria_routing_log;
drop policy if exists "lunaria_routing_log_select_own" on public.lunaria_routing_log;
drop policy if exists "lunaria_routing_log_insert_own" on public.lunaria_routing_log;
drop policy if exists "lunaria_routing_log_update_own" on public.lunaria_routing_log;
drop policy if exists "lunaria_routing_log_delete_own" on public.lunaria_routing_log;

drop policy if exists "lunaria_route_master_read" on public.lunaria_route_master;
drop policy if exists "lunaria_route_master_select_authenticated" on public.lunaria_route_master;

drop policy if exists "lunaria_own_review" on public.lunaria_routing_review;
drop policy if exists "lunaria_routing_review_select_own" on public.lunaria_routing_review;
drop policy if exists "lunaria_routing_review_insert_own" on public.lunaria_routing_review;
drop policy if exists "lunaria_routing_review_update_own" on public.lunaria_routing_review;
drop policy if exists "lunaria_routing_review_delete_own" on public.lunaria_routing_review;

drop policy if exists "lunaria_own_emotion" on public.lunaria_emotion_state;
drop policy if exists "lunaria_emotion_state_select_own" on public.lunaria_emotion_state;
drop policy if exists "lunaria_emotion_state_insert_own" on public.lunaria_emotion_state;
drop policy if exists "lunaria_emotion_state_update_own" on public.lunaria_emotion_state;
drop policy if exists "lunaria_emotion_state_delete_own" on public.lunaria_emotion_state;

drop policy if exists "lunaria_own_affinity" on public.lunaria_affinity;
drop policy if exists "lunaria_affinity_select_own" on public.lunaria_affinity;
drop policy if exists "lunaria_affinity_insert_own" on public.lunaria_affinity;
drop policy if exists "lunaria_affinity_update_own" on public.lunaria_affinity;
drop policy if exists "lunaria_affinity_delete_own" on public.lunaria_affinity;

drop policy if exists "lunaria_own_extract" on public.lunaria_extractions;
drop policy if exists "lunaria_extractions_select_own" on public.lunaria_extractions;
drop policy if exists "lunaria_extractions_insert_own" on public.lunaria_extractions;
drop policy if exists "lunaria_extractions_update_own" on public.lunaria_extractions;
drop policy if exists "lunaria_extractions_delete_own" on public.lunaria_extractions;

drop policy if exists "lunaria_own_diary" on public.lunaria_diary_logs;
drop policy if exists "lunaria_diary_logs_select_own" on public.lunaria_diary_logs;
drop policy if exists "lunaria_diary_logs_insert_own" on public.lunaria_diary_logs;
drop policy if exists "lunaria_diary_logs_update_own" on public.lunaria_diary_logs;
drop policy if exists "lunaria_diary_logs_delete_own" on public.lunaria_diary_logs;

drop policy if exists "lunaria_own_pref" on public.lunaria_preferences;
drop policy if exists "lunaria_preferences_select_own" on public.lunaria_preferences;
drop policy if exists "lunaria_preferences_insert_own" on public.lunaria_preferences;
drop policy if exists "lunaria_preferences_update_own" on public.lunaria_preferences;
drop policy if exists "lunaria_preferences_delete_own" on public.lunaria_preferences;

drop policy if exists "lunaria_own_rel" on public.lunaria_relationship_state;
drop policy if exists "lunaria_relationship_state_select_own" on public.lunaria_relationship_state;
drop policy if exists "lunaria_relationship_state_insert_own" on public.lunaria_relationship_state;
drop policy if exists "lunaria_relationship_state_update_own" on public.lunaria_relationship_state;
drop policy if exists "lunaria_relationship_state_delete_own" on public.lunaria_relationship_state;

drop policy if exists "lunaria_own_profile" on public.lunaria_user_profile;
drop policy if exists "lunaria_user_profile_select_own" on public.lunaria_user_profile;
drop policy if exists "lunaria_user_profile_insert_own" on public.lunaria_user_profile;
drop policy if exists "lunaria_user_profile_update_own" on public.lunaria_user_profile;
drop policy if exists "lunaria_user_profile_delete_own" on public.lunaria_user_profile;

drop policy if exists "lunaria_own_archive" on public.lunaria_profile_archive;
drop policy if exists "lunaria_profile_archive_select_own" on public.lunaria_profile_archive;

drop policy if exists "lunaria_own_pending" on public.lunaria_pending_profile_updates;
drop policy if exists "lunaria_pending_profile_updates_select_own" on public.lunaria_pending_profile_updates;
drop policy if exists "lunaria_pending_profile_updates_insert_own" on public.lunaria_pending_profile_updates;
drop policy if exists "lunaria_pending_profile_updates_update_own" on public.lunaria_pending_profile_updates;
drop policy if exists "lunaria_pending_profile_updates_delete_own" on public.lunaria_pending_profile_updates;

drop policy if exists "lunaria_gacha_pool_select_authenticated" on public.lunaria_gacha_pool;

drop policy if exists "lunaria_gacha_tickets_select_own" on public.lunaria_gacha_tickets;
drop policy if exists "lunaria_gacha_coins_select_own" on public.lunaria_gacha_coins;
drop policy if exists "lunaria_gacha_inventory_select_own" on public.lunaria_gacha_inventory;
drop policy if exists "lunaria_gacha_history_select_own" on public.lunaria_gacha_history;
drop policy if exists "lunaria_gacha_daily_bonus_select_own" on public.lunaria_gacha_daily_bonus;
drop policy if exists "lunaria_gacha_daily_quota_select_own" on public.lunaria_gacha_daily_quota;
drop policy if exists "lunaria_gacha_pity_state_select_own" on public.lunaria_gacha_pity_state;

drop policy if exists "lunaria_own_memory_candidates" on public.lunaria_memory_candidates;
drop policy if exists "lunaria_memory_candidates_select_own" on public.lunaria_memory_candidates;
drop policy if exists "lunaria_memory_candidates_insert_own" on public.lunaria_memory_candidates;
drop policy if exists "lunaria_memory_candidates_update_own" on public.lunaria_memory_candidates;
drop policy if exists "lunaria_memory_candidates_delete_own" on public.lunaria_memory_candidates;

drop policy if exists "lunaria_own_user_items_select" on public.lunaria_user_items;
drop policy if exists "lunaria_own_user_items_insert" on public.lunaria_user_items;
drop policy if exists "lunaria_own_user_items_update" on public.lunaria_user_items;
drop policy if exists "lunaria_own_user_items_delete" on public.lunaria_user_items;
drop policy if exists "lunaria_user_items_select_own" on public.lunaria_user_items;
drop policy if exists "lunaria_user_items_insert_own" on public.lunaria_user_items;
drop policy if exists "lunaria_user_items_update_own" on public.lunaria_user_items;
drop policy if exists "lunaria_user_items_delete_own" on public.lunaria_user_items;

drop policy if exists "lunaria_own_character_states_select" on public.lunaria_character_states;
drop policy if exists "lunaria_own_character_states_insert" on public.lunaria_character_states;
drop policy if exists "lunaria_own_character_states_update" on public.lunaria_character_states;
drop policy if exists "lunaria_own_character_states_delete" on public.lunaria_character_states;
drop policy if exists "lunaria_character_states_select_own" on public.lunaria_character_states;
drop policy if exists "lunaria_character_states_insert_own" on public.lunaria_character_states;
drop policy if exists "lunaria_character_states_update_own" on public.lunaria_character_states;
drop policy if exists "lunaria_character_states_delete_own" on public.lunaria_character_states;

-- ---------------------------------------------------------------------------
-- User root table.
-- ---------------------------------------------------------------------------

create policy "lunaria_users_select_own"
  on public.lunaria_users for select to authenticated
  using ((select auth.uid()) = id);

create policy "lunaria_users_insert_own"
  on public.lunaria_users for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "lunaria_users_update_own"
  on public.lunaria_users for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "lunaria_users_delete_own"
  on public.lunaria_users for delete to authenticated
  using ((select auth.uid()) = id);

-- ---------------------------------------------------------------------------
-- User-owned tables with direct user_id.
-- ---------------------------------------------------------------------------

create policy "lunaria_messages_select_own"
  on public.lunaria_messages for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_messages_insert_own"
  on public.lunaria_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_messages_update_own"
  on public.lunaria_messages for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_messages_delete_own"
  on public.lunaria_messages for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_core_memory_select_own"
  on public.lunaria_core_memory for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_core_memory_insert_own"
  on public.lunaria_core_memory for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_core_memory_update_own"
  on public.lunaria_core_memory for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_core_memory_delete_own"
  on public.lunaria_core_memory for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_routing_log_select_own"
  on public.lunaria_routing_log for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_routing_log_insert_own"
  on public.lunaria_routing_log for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_routing_log_update_own"
  on public.lunaria_routing_log for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_routing_log_delete_own"
  on public.lunaria_routing_log for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_emotion_state_select_own"
  on public.lunaria_emotion_state for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_emotion_state_insert_own"
  on public.lunaria_emotion_state for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_emotion_state_update_own"
  on public.lunaria_emotion_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_emotion_state_delete_own"
  on public.lunaria_emotion_state for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_affinity_select_own"
  on public.lunaria_affinity for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_affinity_insert_own"
  on public.lunaria_affinity for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_affinity_update_own"
  on public.lunaria_affinity for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_affinity_delete_own"
  on public.lunaria_affinity for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_extractions_select_own"
  on public.lunaria_extractions for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_extractions_insert_own"
  on public.lunaria_extractions for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_extractions_update_own"
  on public.lunaria_extractions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_extractions_delete_own"
  on public.lunaria_extractions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_diary_logs_select_own"
  on public.lunaria_diary_logs for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_diary_logs_insert_own"
  on public.lunaria_diary_logs for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_diary_logs_update_own"
  on public.lunaria_diary_logs for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_diary_logs_delete_own"
  on public.lunaria_diary_logs for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_preferences_select_own"
  on public.lunaria_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_preferences_insert_own"
  on public.lunaria_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_preferences_update_own"
  on public.lunaria_preferences for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_preferences_delete_own"
  on public.lunaria_preferences for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_relationship_state_select_own"
  on public.lunaria_relationship_state for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_relationship_state_insert_own"
  on public.lunaria_relationship_state for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_relationship_state_update_own"
  on public.lunaria_relationship_state for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_relationship_state_delete_own"
  on public.lunaria_relationship_state for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_user_profile_select_own"
  on public.lunaria_user_profile for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_user_profile_insert_own"
  on public.lunaria_user_profile for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_user_profile_update_own"
  on public.lunaria_user_profile for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_user_profile_delete_own"
  on public.lunaria_user_profile for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_profile_archive_select_own"
  on public.lunaria_profile_archive for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_pending_profile_updates_select_own"
  on public.lunaria_pending_profile_updates for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_pending_profile_updates_insert_own"
  on public.lunaria_pending_profile_updates for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_pending_profile_updates_update_own"
  on public.lunaria_pending_profile_updates for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_pending_profile_updates_delete_own"
  on public.lunaria_pending_profile_updates for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_memory_candidates_select_own"
  on public.lunaria_memory_candidates for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_memory_candidates_insert_own"
  on public.lunaria_memory_candidates for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_memory_candidates_update_own"
  on public.lunaria_memory_candidates for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_memory_candidates_delete_own"
  on public.lunaria_memory_candidates for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_user_items_select_own"
  on public.lunaria_user_items for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_user_items_insert_own"
  on public.lunaria_user_items for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_user_items_update_own"
  on public.lunaria_user_items for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_user_items_delete_own"
  on public.lunaria_user_items for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_character_states_select_own"
  on public.lunaria_character_states for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "lunaria_character_states_insert_own"
  on public.lunaria_character_states for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "lunaria_character_states_update_own"
  on public.lunaria_character_states for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "lunaria_character_states_delete_own"
  on public.lunaria_character_states for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Routing review rows are owned through their parent routing log.
-- ---------------------------------------------------------------------------

create policy "lunaria_routing_review_select_own"
  on public.lunaria_routing_review for select to authenticated
  using (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  );

create policy "lunaria_routing_review_insert_own"
  on public.lunaria_routing_review for insert to authenticated
  with check (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  );

create policy "lunaria_routing_review_update_own"
  on public.lunaria_routing_review for update to authenticated
  using (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  );

create policy "lunaria_routing_review_delete_own"
  on public.lunaria_routing_review for delete to authenticated
  using (
    exists (
      select 1
      from public.lunaria_routing_log l
      where l.id = routing_log_id
        and l.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Read-only catalogs.
-- ---------------------------------------------------------------------------

create policy "lunaria_route_master_select_authenticated"
  on public.lunaria_route_master for select to authenticated
  using (true);

create policy "lunaria_gacha_pool_select_authenticated"
  on public.lunaria_gacha_pool for select to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Server-managed gacha/economy state. Users can read only their own rows.
-- ---------------------------------------------------------------------------

create policy "lunaria_gacha_tickets_select_own"
  on public.lunaria_gacha_tickets for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_coins_select_own"
  on public.lunaria_gacha_coins for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_inventory_select_own"
  on public.lunaria_gacha_inventory for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_history_select_own"
  on public.lunaria_gacha_history for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_daily_bonus_select_own"
  on public.lunaria_gacha_daily_bonus for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_daily_quota_select_own"
  on public.lunaria_gacha_daily_quota for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "lunaria_gacha_pity_state_select_own"
  on public.lunaria_gacha_pity_state for select to authenticated
  using ((select auth.uid()) = user_id);
