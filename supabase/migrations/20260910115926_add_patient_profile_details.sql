alter table public.profiles
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists phone text,
  add column if not exists height_cm numeric(5,2),
  add column if not exists weight_kg numeric(6,2),
  add column if not exists blood_group text,
  add column if not exists allergies text,
  add column if not exists medical_conditions text,
  add column if not exists medications text,
  add column if not exists previous_surgeries text,
  add column if not exists family_medical_history text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists emergency_contact_relationship text,
  add column if not exists smoking_status text,
  add column if not exists alcohol_use text,
  add column if not exists activity_level text,
  add column if not exists diet_preference text,
  add column if not exists occupation text,
  add column if not exists location text,
  add column if not exists primary_doctor text,
  add column if not exists medical_notes text;

alter table public.profiles
  add constraint profiles_height_positive check (height_cm is null or height_cm > 0),
  add constraint profiles_weight_positive check (weight_kg is null or weight_kg > 0);
