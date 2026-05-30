-- Supabase Seed Data for FarmaWatch
-- Run AFTER the schema migration

-- Seed ticket categories
INSERT INTO ticket_categories (name) VALUES
  ('Penyalahgunaan OTC'),
  ('Penjualan Obat Keras Ilegal');

-- Seed rejection reasons
INSERT INTO rejection_reasons (label) VALUES
  ('Laporan duplikat'),
  ('Informasi tidak lengkap'),
  ('Di luar ruang lingkup'),
  ('Tidak dapat diverifikasi'),
  ('Spam / tidak relevan');

-- Note: Superadmin must be created manually via Supabase Dashboard:
-- 1. Go to Authentication → Users → Add User
-- 2. Create a user with email and password
-- 3. Go to the SQL Editor and run:
--    UPDATE profiles SET role = 'superadmin', status = 'approved' WHERE id = '<user-uuid>';
