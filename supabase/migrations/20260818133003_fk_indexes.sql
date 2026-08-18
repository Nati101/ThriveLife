create index if not exists assessment_sessions_instrument_id_idx on public.assessment_sessions (instrument_id);
create index if not exists drain_results_user_id_idx on public.drain_results (user_id);
create index if not exists items_response_scale_id_idx on public.items (response_scale_id);
create index if not exists overcharge_flags_session_id_idx on public.overcharge_flags (session_id);
create index if not exists recommendation_lookups_action_id_idx on public.recommendation_lookups (recharge_action_id);
create index if not exists signal_count_logs_user_id_idx on public.signal_count_logs (user_id);
