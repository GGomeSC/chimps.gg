-- Reorders a strategy's steps to match the given id array (1-based positions).
-- Callers must send the strategy's complete step id list; steps omitted from
-- the array keep their old order_index and would collide at commit. The
-- deferrable unique (strategy_id, order_index) defers the check to commit,
-- allowing intermediate duplicate states within the single UPDATE.
create function public.reorder_steps(p_strategy_id bigint, p_step_ids bigint[])
returns void
language sql
as $$
  update public.steps s
  set order_index = new_order.idx::integer
  from unnest(p_step_ids) with ordinality as new_order (step_id, idx)
  where s.id = new_order.step_id
    and s.strategy_id = p_strategy_id;
$$;
