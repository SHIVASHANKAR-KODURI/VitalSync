import { supabase } from './supabase.js';
import { STORAGE_BUCKET } from './config.js';
import { todayISO } from './utils.js';

async function user() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error('Not authenticated');
  return data.user;
}

export async function getProfile() {
  const u = await user();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', u.id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function saveProfile(profile) {
  const u = await user();
  const row = {
    id: u.id,
    full_name: profile.full_name?.trim() || null,
    date_of_birth: profile.date_of_birth || null,
    gender: profile.gender || null,
    phone: profile.phone?.trim() || null,
    height_cm: profile.height_cm === '' || profile.height_cm == null ? null : Number(profile.height_cm),
    weight_kg: profile.weight_kg === '' || profile.weight_kg == null ? null : Number(profile.weight_kg),
    blood_group: profile.blood_group || null,
    allergies: profile.allergies?.trim() || null,
    medical_conditions: profile.medical_conditions?.trim() || null,
    medications: profile.medications?.trim() || null,
    previous_surgeries: profile.previous_surgeries?.trim() || null,
    family_medical_history: profile.family_medical_history?.trim() || null,
    emergency_contact_name: profile.emergency_contact_name?.trim() || null,
    emergency_contact_phone: profile.emergency_contact_phone?.trim() || null,
    emergency_contact_relationship: profile.emergency_contact_relationship || null,
    smoking_status: profile.smoking_status || null,
    alcohol_use: profile.alcohol_use || null,
    activity_level: profile.activity_level || null,
    diet_preference: profile.diet_preference || null,
    occupation: profile.occupation?.trim() || null,
    location: profile.location?.trim() || null,
    primary_doctor: profile.primary_doctor?.trim() || null,
    medical_notes: profile.medical_notes?.trim() || null,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(row)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listDailyLogs() {
  const u = await user();
  const { data, error } = await supabase.from('daily_logs').select('*').eq('user_id', u.id).order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveDailyLog(log) {
  const u = await user();
  const row = {
    user_id: u.id,
    date: log.date || todayISO(),
    sleep_hrs: log.sleep_hrs ?? null,
    breakfast: log.breakfast ?? null,
    lunch: log.lunch ?? null,
    dinner: log.dinner ?? null,
    walk_km: log.walk_km ?? null,
    mood: log.mood ?? null,
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase.from('daily_logs').upsert(row, { onConflict: 'user_id,date' }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteDailyLog(date) {
  const u = await user();
  const { error } = await supabase.from('daily_logs').delete().eq('user_id', u.id).eq('date', date);
  if (error) throw error;
}

export async function deleteAllDailyLogs() {
  const u = await user();
  const { error } = await supabase.from('daily_logs').delete().eq('user_id', u.id);
  if (error) throw error;
}

export async function listInsights() {
  const u = await user();
  const { data, error } = await supabase.from('insights').select('*').eq('user_id', u.id).order('created_at', { ascending: false }).limit(10);
  if (error) throw error;
  return data || [];
}

export async function saveInsight(type, text) {
  const u = await user();
  const { data, error } = await supabase.from('insights').insert({ user_id: u.id, type, text }).select().single();
  if (error) throw error;
  return data;
}

export async function listReports() {
  const u = await user();
  const { data, error } = await supabase.from('reports').select('*').eq('user_id', u.id).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function uploadReport(file) {
  const u = await user();
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${u.id}/${crypto.randomUUID()}-${safe}`;
  const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;
  const { data, error } = await supabase.from('reports').insert({ user_id: u.id, name: file.name, storage_path: path, mime_type: file.type, report_date: todayISO(), status: 'New' }).select().single();
  if (error) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    throw error;
  }
  return data;
}

export async function updateReportSummary(id, summary) {
  const u = await user();
  const { data, error } = await supabase.from('reports').update({ summary, status: 'Analyzed', updated_at: new Date().toISOString() }).eq('id', id).eq('user_id', u.id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteReport(report) {
  const u = await user();
  const { error } = await supabase.from('reports').delete().eq('id', report.id).eq('user_id', u.id);
  if (error) throw error;
  await supabase.storage.from(STORAGE_BUCKET).remove([report.storage_path]);
}
