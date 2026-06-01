-- Bookings table for rental and custom concept requests.
-- Pricing is stored as-calculated so historical records reflect what the client saw.
-- No availability conflict checking in MVP.

CREATE TABLE bookings (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name          text        NOT NULL,
  client_email         text        NOT NULL,
  client_phone         text        NOT NULL DEFAULT '',
  trailer_size         text        NOT NULL
    CHECK (trailer_size IN ('small', 'medium', 'large')),
  start_date           date        NOT NULL,
  end_date             date        NOT NULL,
  nights               int         NOT NULL GENERATED ALWAYS AS (end_date - start_date) STORED,
  nightly_rate_usd     numeric(8,2) NOT NULL,
  upgrade_ids          text[]      NOT NULL DEFAULT '{}',
  upgrades_total_usd   numeric(8,2) NOT NULL DEFAULT 0,
  rental_total_usd     numeric(8,2) NOT NULL,
  is_custom_concept    boolean     NOT NULL DEFAULT false,
  concept_package_id   text,
  off_grid_notes       text        NOT NULL DEFAULT '',
  customization_notes  text        NOT NULL DEFAULT '',
  special_notes        text        NOT NULL DEFAULT '',
  status               text        NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'booking_requested', 'pending_review',
      'booking_confirmed', 'declined', 'cancelled'
    )),
  admin_notes          text        NOT NULL DEFAULT '',
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_bookings_status       ON bookings(status);
CREATE INDEX idx_bookings_trailer_size ON bookings(trailer_size);
CREATE INDEX idx_bookings_client_email ON bookings(client_email);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON bookings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON bookings TO authenticated;
