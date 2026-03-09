-- Enable Supabase Realtime for contract tables.
-- This must be run manually in the Supabase SQL Editor.
-- `yarn db:push` does NOT apply this -- it only handles schema changes.
--
-- Usage: Copy and paste this into Supabase Dashboard > SQL Editor > New Query > Run.

ALTER PUBLICATION supabase_realtime ADD TABLE rental_contracts, lease_contracts;
