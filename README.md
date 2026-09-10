# VitalSync

VitalSync is a professional personal-health web application with a Supabase backend and authenticated Gemini AI assistance.

## Live website

[https://vitalsync.shankarkoduri21.workers.dev/](https://vitalsync.shankarkoduri21.workers.dev/)

## Project structure

```text
vitalsync/
├── frontend/
│   ├── assets/
│   │   ├── vitalsync-logo-dark.png
│   │   └── vitalsync-logo-light.png
│   ├── css/styles.css
│   ├── index.html
│   └── js/
│       ├── app.js
│       ├── api.js
│       ├── auth.js
│       ├── chat.js
│       ├── config.js
│       ├── dashboard.js
│       ├── data.js
│       ├── history.js
│       ├── reports.js
│       ├── supabase.js
│       └── utils.js
├── supabase/
│   ├── functions/vitalsync-ai/
│   ├── migrations/
│   ├── templates/
│   └── config.toml
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Authentication

VitalSync uses a normal email-link flow. There is no six-digit OTP screen in the frontend:

- Sign up → open the confirmation email → click the confirmation link.
- Forgot password → open the reset email → click the reset link → choose a new password.
- Change password while signed in → confirm the current password and choose a new one.

The Supabase email templates in `supabase/templates/` use the confirmation/recovery URL supplied by Supabase.

## Patient profile

The Profile section stores useful patient context in the authenticated user's `profiles` row, including:

- Full name, date of birth, calculated age, gender and phone
- Height, weight, calculated BMI and blood group
- Allergies, medical conditions, medications and previous surgeries
- Family medical history and medical notes
- Emergency contact name, phone and relationship
- Smoking, alcohol, activity level and diet preference
- Occupation, location and primary doctor/clinic

Age and BMI are calculated in the UI and are not stored as duplicate fields.

## Supabase

The project intentionally reuses the existing Supabase project configured in `frontend/js/config.js`.

Profile data remains protected by the existing authenticated-user RLS policies. The patient-profile migration is included in `supabase/migrations/20260910115926_add_patient_profile_details.sql`.

Clinical reports are stored in the private `clinical-reports` storage bucket.

## Gemini AI

AI requests are made only through the authenticated `vitalsync-ai` Edge Function. The function uses the `gemini-3.5-flash-lite` model.

Set the server-side secret in:

`Supabase Dashboard → Edge Functions → Secrets`

Secret name:

`GEMINI_API_KEY`

Do not put the Gemini API key in the frontend.

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Edge Function deployment

```bash
supabase login
supabase link --project-ref aiavwyjuukujdvjzjesu
supabase functions deploy vitalsync-ai
```

Do not create a new Supabase project for VitalSync.
