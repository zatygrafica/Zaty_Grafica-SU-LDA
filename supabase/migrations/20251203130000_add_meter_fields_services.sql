-- Add meter-specific fields to services
alter table public.services
  add column if not exists default_width double precision,
  add column if not exists default_length double precision,
  add column if not exists price_per_sqm double precision;

-- Backfill: if a service is in meters and price_per_sqm is null, reuse base_price
update public.services
set price_per_sqm = base_price
where unit = 'meter' and price_per_sqm is null;
