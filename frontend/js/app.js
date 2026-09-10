import { supabase } from './supabase.js';

import {
  getSession,
  signIn,
  signUp,
  resendSignupEmail,
  signOut,
  sendRecoveryEmail,
  updatePassword,
  validatePassword,
  friendlyAuthError,
  authState
} from './auth.js';

import {
  getProfile,
  saveProfile,
  listDailyLogs,
  listInsights,
  listReports
} from './data.js';

import {
  dashboardPage,
  loadDashboardState
} from './dashboard.js';

import {
  chatPage,
  resetChat,
  sendMessage
} from './chat.js';

import {
  historyPage,
  generateReport,
  clearToday,
  clearAll
} from './history.js';

import {
  reportsPage,
  uploadPage,
  handleUpload,
  analyzeSelected,
  analyzeReportById,
  removeReport
} from './reports.js';

import {
  escapeHTML,
  toast
} from './utils.js';


/* =========================================================
   AUTH PAGES
========================================================= */

const AUTH_PAGES = new Set([
  'login',
  'signup',
  'forgot',
  'email-sent',
  'new-password'
]);


/* =========================================================
   GLOBAL STATE
========================================================= */

const state = {
  page: 'login',

  profile: null,
  logs: [],
  insights: [],
  reports: [],

  emailFlow: 'signup',
  emailAddress: '',

  recoveryFlow: false,
  email: ''
};

window.__vitalState = state;


/* =========================================================
   AUTH UI
========================================================= */

function logo(variant = 'dark') {
  const source = variant === 'light'
    ? './assets/vitalsync-logo-light.png'
    : './assets/vitalsync-logo-dark.png';

  return `
    <img
      src="${source}"
      alt="VitalSync"
      class="brand-logo ${variant === 'light' ? 'brand-logo-light' : ''}"
    />
  `;
}


function authShell(content) {
  return `
    <div class="auth-shell min-h-screen flex items-center justify-center p-4">
      <div class="auth-card rounded-2xl p-7 sm:p-8 max-w-md w-full">
        ${content}
      </div>
    </div>
  `;
}


function authHeader(title, description) {
  return `
    ${logo()}

    <div class="text-center mt-6 mb-7">
      <h1 class="text-3xl font-bold">
        ${title}
      </h1>

      <p class="text-gray-500 mt-2">
        ${description}
      </p>
    </div>
  `;
}


/* =========================================================
   LOGIN
========================================================= */

function LoginPage() {
  return authShell(`
    ${authHeader(
      'Welcome Back',
      'Sign in to continue your health journey.'
    )}

    <form
      id="login-form"
      class="space-y-4"
      novalidate
    >

      <div>
        <label
          class="block text-sm font-medium mb-2"
          for="login-email"
        >
          Email
        </label>

        <input
          id="login-email"
          type="email"
          autocomplete="email"
          class="input-field"
          placeholder="you@example.com"
          required
        />
      </div>


      <div>
        <label
          class="block text-sm font-medium mb-2"
          for="login-password"
        >
          Password
        </label>

        <input
          id="login-password"
          type="password"
          autocomplete="current-password"
          class="input-field"
          placeholder="Your password"
          required
        />
      </div>


      <button
        id="login-submit"
        class="btn-primary w-full py-3 rounded-lg font-semibold"
      >
        Sign In
      </button>

    </form>


    <div class="flex justify-between mt-6 text-sm">

      <button
        id="forgot-link"
        class="text-accent"
      >
        Forgot password?
      </button>

      <button
        id="signup-link"
        class="text-accent"
      >
        Create account
      </button>

    </div>
  `);
}


/* =========================================================
   SIGN UP
========================================================= */

function SignupPage() {
  return authShell(`
    ${authHeader(
      'Create Your Account',
      'Your health data will be stored under your secure account.'
    )}

    <form
      id="signup-form"
      class="space-y-4"
      novalidate
    >

      <div>
        <label
          class="block text-sm font-medium mb-2"
          for="signup-name"
        >
          Full Name
        </label>

        <input
          id="signup-name"
          autocomplete="name"
          class="input-field"
          placeholder="Your name"
          required
        />
      </div>


      <div>
        <label
          class="block text-sm font-medium mb-2"
          for="signup-email"
        >
          Email
        </label>

        <input
          id="signup-email"
          type="email"
          autocomplete="email"
          class="input-field"
          placeholder="you@example.com"
          required
        />
      </div>


      <div>
        <label
          class="block text-sm font-medium mb-2"
          for="signup-password"
        >
          Password
        </label>

        <input
          id="signup-password"
          type="password"
          autocomplete="new-password"
          class="input-field"
          placeholder="At least 8 characters"
          required
        />

        <p class="text-xs text-gray-500 mt-1">
          Use at least 8 characters.
        </p>
      </div>


      <div>
        <label
          class="block text-sm font-medium mb-2"
          for="signup-confirm"
        >
          Confirm Password
        </label>

        <input
          id="signup-confirm"
          type="password"
          autocomplete="new-password"
          class="input-field"
          placeholder="Repeat password"
          required
        />
      </div>


      <button
        id="signup-submit"
        class="btn-primary w-full py-3 rounded-lg font-semibold"
      >
        Create Account
      </button>

    </form>


    <p class="text-center text-sm text-gray-500 mt-6">

      Already have an account?

      <button
        id="back-login"
        class="text-accent font-semibold"
      >
        Sign in
      </button>

    </p>
  `);
}


/* =========================================================
   FORGOT PASSWORD
========================================================= */

function ForgotPage() {
  return authShell(`
    ${authHeader(
      'Reset Your Password',
      'We will send a password reset link to your email.'
    )}

    <form
      id="forgot-form"
      class="space-y-4"
      novalidate
    >

      <div>

        <label
          class="block text-sm font-medium mb-2"
          for="forgot-email"
        >
          Email
        </label>

        <input
          id="forgot-email"
          type="email"
          autocomplete="email"
          class="input-field"
          placeholder="you@example.com"
          required
        />

      </div>


      <button
        id="forgot-submit"
        class="btn-primary w-full py-3 rounded-lg font-semibold"
      >
        Send Reset Link
      </button>

    </form>


    <button
      id="forgot-back"
      class="w-full mt-4 text-sm text-gray-500"
    >
      Back to sign in
    </button>
  `);
}


/* =========================================================
   EMAIL SENT PAGE
========================================================= */

function EmailSentPage() {

  const isRecovery = state.emailFlow === 'recovery';

  const title = 'Check your email';

  const description = isRecovery
    ? 'We sent a password reset link to your email address.'
    : 'We sent a confirmation link to your email address.';


  const steps = isRecovery

    ? [
        'Open your email inbox.',
        'Find the VitalSync password reset email.',
        'Click the “Reset your password” link.',
        'VitalSync will open and let you choose a new password.'
      ]

    : [
        'Open your email inbox.',
        'Find the VitalSync confirmation email.',
        'Click the “Confirm email address” link.',
        'VitalSync will open and finish activating your account.'
      ];


  return authShell(`

    ${authHeader(title, description)}


    <div class="email-instructions rounded-xl p-5">

      <p class="font-semibold text-gray-800 break-all">
        ${escapeHTML(state.emailAddress)}
      </p>


      <ol
        class="mt-5 space-y-3 text-sm text-gray-700 list-decimal list-inside"
      >

        ${steps
          .map(step => `<li>${step}</li>`)
          .join('')}

      </ol>

    </div>


    <p class="text-xs text-gray-500 text-center mt-5">

      If you don't see the email, check
      Spam, Promotions, or Updates.

    </p>


    <button
      id="resend-email"
      class="w-full mt-5 bg-gray-100 py-3 rounded-lg font-semibold"
    >
      Resend Email
    </button>


    <button
      id="email-sent-back"
      class="w-full mt-3 text-sm text-gray-500"
    >
      Back to sign in
    </button>

  `);
}


/* =========================================================
   NEW PASSWORD
========================================================= */

function NewPasswordPage() {

  return authShell(`

    ${authHeader(
      'Set New Password',
      'Choose a strong password for your VitalSync account.'
    )}


    <form
      id="new-password-form"
      class="space-y-4"
      novalidate
    >

      ${
        state.recoveryFlow

          ? ''

          : `
            <div>

              <label
                class="block text-sm font-medium mb-2"
                for="current-password"
              >
                Current Password
              </label>

              <input
                id="current-password"
                type="password"
                autocomplete="current-password"
                class="input-field"
                placeholder="Your current password"
                required
              />

            </div>
          `
      }


      <div>

        <label
          class="block text-sm font-medium mb-2"
          for="new-password"
        >
          New Password
        </label>

        <input
          id="new-password"
          type="password"
          autocomplete="new-password"
          class="input-field"
          placeholder="At least 8 characters"
          required
        />

      </div>


      <div>

        <label
          class="block text-sm font-medium mb-2"
          for="new-password-confirm"
        >
          Confirm New Password
        </label>

        <input
          id="new-password-confirm"
          type="password"
          autocomplete="new-password"
          class="input-field"
          placeholder="Repeat new password"
          required
        />

      </div>


      <button
        id="update-password-btn"
        class="btn-primary w-full py-3 rounded-lg font-semibold"
      >
        Update Password
      </button>

    </form>

  `);
}


/* =========================================================
   ACCOUNT PAGE
========================================================= */

function profileValue(key) {
  return escapeHTML(state.profile?.[key] ?? '');
}

function calculateAge(dateValue) {
  if (!dateValue) return '';
  const dob = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return '';
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const month = today.getMonth() - dob.getMonth();
  if (month < 0 || (month === 0 && today.getDate() < dob.getDate())) age--;
  return age >= 0 ? String(age) : '';
}

function calculateBMI(height, weight) {
  const h = Number(height) / 100;
  const w = Number(weight);
  if (!h || !w || h <= 0 || w <= 0) return '';
  return (w / (h * h)).toFixed(1);
}

function ProfilePage() {
  const age = calculateAge(state.profile?.date_of_birth);
  const bmi = calculateBMI(state.profile?.height_cm, state.profile?.weight_kg);

  return `
    <div class="page-wrap">
      <div class="page-heading">
        <div>
          <p class="eyebrow">PERSONAL HEALTH PROFILE</p>
          <h1 class="page-title">Your Profile</h1>
          <p class="page-subtitle">Keep the information clinicians and VitalSync may need in one secure place.</p>
        </div>
      </div>

      <div class="profile-overview dashboard-card">
        <div class="profile-avatar">${escapeHTML((state.profile?.full_name || 'V').trim().charAt(0).toUpperCase())}</div>
        <div class="profile-overview-main">
          <h2>${escapeHTML(state.profile?.full_name || 'Complete your profile')}</h2>
          <p>${escapeHTML(state.email || 'Your account email')}</p>
        </div>
        <div class="profile-stat">
          <span>Age</span><strong id="profile-age-value">${age || '—'}</strong>
        </div>
        <div class="profile-stat">
          <span>BMI</span><strong id="profile-bmi-value">${bmi || '—'}</strong>
        </div>
      </div>

      <form id="full-profile-form" class="profile-form">
        <section class="dashboard-card profile-section">
          <div class="section-heading"><div><p class="eyebrow">01</p><h2>Personal details</h2></div><span class="section-note">Basic identity</span></div>
          <div class="form-grid">
            <label class="form-field span-2"><span>Full name</span><input id="p-full_name" class="input-field" value="${profileValue('full_name')}" placeholder="Your full name" required></label>
            <label class="form-field"><span>Date of birth</span><input id="p-date_of_birth" type="date" max="${new Date().toISOString().slice(0,10)}" class="input-field" value="${profileValue('date_of_birth')}"></label>
            <label class="form-field"><span>Age</span><input id="p-age" class="input-field calculated-field" value="${age}" placeholder="Auto-calculated" readonly></label>
            <label class="form-field"><span>Gender</span><select id="p-gender" class="input-field"><option value="">Prefer not to say</option><option value="Male" ${state.profile?.gender === 'Male' ? 'selected' : ''}>Male</option><option value="Female" ${state.profile?.gender === 'Female' ? 'selected' : ''}>Female</option><option value="Non-binary" ${state.profile?.gender === 'Non-binary' ? 'selected' : ''}>Non-binary</option></select></label>
            <label class="form-field"><span>Phone number</span><input id="p-phone" type="tel" autocomplete="tel" class="input-field" value="${profileValue('phone')}" placeholder="+91 …"></label>
            <label class="form-field"><span>Occupation</span><input id="p-occupation" class="input-field" value="${profileValue('occupation')}" placeholder="Student, engineer, teacher…"></label>
            <label class="form-field"><span>Location</span><input id="p-location" class="input-field" value="${profileValue('location')}" placeholder="City, state"></label>
            <label class="form-field span-2"><span>Account email</span><input class="input-field calculated-field" value="${escapeHTML(state.email || '')}" readonly></label>
          </div>
        </section>

        <section class="dashboard-card profile-section">
          <div class="section-heading"><div><p class="eyebrow">02</p><h2>Body & measurements</h2></div><span class="section-note">Used for context only</span></div>
          <div class="form-grid">
            <label class="form-field"><span>Height (cm)</span><input id="p-height_cm" type="number" min="1" max="300" step="0.1" class="input-field" value="${profileValue('height_cm')}" placeholder="e.g. 175"></label>
            <label class="form-field"><span>Weight (kg)</span><input id="p-weight_kg" type="number" min="1" max="500" step="0.1" class="input-field" value="${profileValue('weight_kg')}" placeholder="e.g. 70"></label>
            <label class="form-field"><span>BMI</span><input id="p-bmi" class="input-field calculated-field" value="${bmi}" placeholder="Auto-calculated" readonly></label>
            <label class="form-field"><span>Blood group</span><select id="p-blood_group" class="input-field"><option value="">Select</option>${['A+','A−','B+','B−','AB+','AB−','O+','O−'].map(x => `<option value="${x}" ${state.profile?.blood_group === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          </div>
        </section>

        <section class="dashboard-card profile-section">
          <div class="section-heading"><div><p class="eyebrow">03</p><h2>Medical background</h2></div><span class="section-note">Important clinical context</span></div>
          <div class="form-grid">
            <label class="form-field span-2"><span>Allergies</span><textarea id="p-allergies" class="input-field textarea-field" placeholder="Medicines, foods, environmental allergies…">${profileValue('allergies')}</textarea></label>
            <label class="form-field span-2"><span>Existing medical conditions</span><textarea id="p-medical_conditions" class="input-field textarea-field" placeholder="Asthma, diabetes, hypertension, etc. — if applicable">${profileValue('medical_conditions')}</textarea></label>
            <label class="form-field span-2"><span>Current medications</span><textarea id="p-medications" class="input-field textarea-field" placeholder="Medicine name, dosage, frequency — if applicable">${profileValue('medications')}</textarea></label>
            <label class="form-field span-2"><span>Previous surgeries / major procedures</span><textarea id="p-previous_surgeries" class="input-field textarea-field" placeholder="Include approximate year if useful">${profileValue('previous_surgeries')}</textarea></label>
            <label class="form-field span-2"><span>Family medical history</span><textarea id="p-family_medical_history" class="input-field textarea-field" placeholder="Relevant family history such as diabetes, heart disease, cancer…">${profileValue('family_medical_history')}</textarea></label>
            <label class="form-field"><span>Primary doctor / clinic</span><input id="p-primary_doctor" class="input-field" value="${profileValue('primary_doctor')}" placeholder="Optional"></label>
            <label class="form-field span-2"><span>Important medical notes</span><textarea id="p-medical_notes" class="input-field textarea-field" placeholder="Anything important you want to keep with your profile">${profileValue('medical_notes')}</textarea></label>
          </div>
        </section>

        <section class="dashboard-card profile-section">
          <div class="section-heading"><div><p class="eyebrow">04</p><h2>Emergency contact</h2></div><span class="section-note">For your safety</span></div>
          <div class="form-grid">
            <label class="form-field"><span>Contact name</span><input id="p-emergency_contact_name" class="input-field" value="${profileValue('emergency_contact_name')}" placeholder="Full name"></label>
            <label class="form-field"><span>Phone number</span><input id="p-emergency_contact_phone" type="tel" class="input-field" value="${profileValue('emergency_contact_phone')}" placeholder="+91 …"></label>
            <label class="form-field"><span>Relationship</span><select id="p-emergency_contact_relationship" class="input-field"><option value="">Select</option>${['Parent','Spouse','Sibling','Child','Friend','Other'].map(x => `<option value="${x}" ${state.profile?.emergency_contact_relationship === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          </div>
        </section>

        <section class="dashboard-card profile-section">
          <div class="section-heading"><div><p class="eyebrow">05</p><h2>Lifestyle</h2></div><span class="section-note">Optional context</span></div>
          <div class="form-grid">
            <label class="form-field"><span>Smoking</span><select id="p-smoking_status" class="input-field"><option value="">Select</option>${['Never','Former smoker','Occasionally','Daily'].map(x => `<option value="${x}" ${state.profile?.smoking_status === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
            <label class="form-field"><span>Alcohol</span><select id="p-alcohol_use" class="input-field"><option value="">Select</option>${['Never','Occasionally','Regularly'].map(x => `<option value="${x}" ${state.profile?.alcohol_use === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
            <label class="form-field"><span>Activity level</span><select id="p-activity_level" class="input-field"><option value="">Select</option>${['Sedentary','Lightly active','Moderately active','Very active'].map(x => `<option value="${x}" ${state.profile?.activity_level === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
            <label class="form-field"><span>Diet preference</span><select id="p-diet_preference" class="input-field"><option value="">Select</option>${['No preference','Vegetarian','Vegan','Eggetarian','Non-vegetarian','Other'].map(x => `<option value="${x}" ${state.profile?.diet_preference === x ? 'selected' : ''}>${x}</option>`).join('')}</select></label>
          </div>
        </section>

        <div class="profile-savebar">
          <p><strong>Your information stays in your VitalSync account.</strong><br><span>Only provide details you are comfortable storing.</span></p>
          <button id="save-full-profile" class="btn-primary px-6 py-3 rounded-xl font-semibold">Save Profile</button>
        </div>
      </form>
    </div>
  `;
}

function AccountPage() {
  return `
    <div class="page-wrap">
      <div class="page-heading">
        <div>
          <p class="eyebrow">ACCOUNT</p>
          <h1 class="page-title">Account & Security</h1>
          <p class="page-subtitle">Manage your password and sign-in security.</p>
        </div>
      </div>

      <div class="dashboard-card p-7 max-w-3xl">
        <div class="security-row">
          <div class="security-icon">✦</div>
          <div><h2>Change Password</h2><p>Confirm your current password before choosing a new one. VitalSync never stores your password itself.</p></div>
        </div>
        <button id="change-password-btn" class="btn-primary px-5 py-3 rounded-xl font-semibold">Change Password</button>
      </div>
    </div>
  `;
}


/* =========================================================
   APP SHELL
========================================================= */

function Sidebar() {
  const links = [
    ['dashboard', 'Dashboard', '⌂'],
    ['chat', 'Daily Check-in', '✓'],
    ['history', 'Health History', '↺'],
    ['reports', 'Clinical Reports', '▣'],
    ['profile', 'Profile', '●'],
    ['account', 'Account & Security', '◈']
  ];

  return `
    <aside class="app-sidebar" aria-label="Primary navigation">
      <div class="sidebar-inner">
        <div class="sidebar-brand">
          <div class="sidebar-logo-wrap">${logo('light')}</div>
          <span>Personal Health Companion</span>
        </div>

        <nav class="sidebar-nav" aria-label="VitalSync sections">
          ${links.map(([page, title, icon]) => `
            <a href="#" data-nav="${page}" class="sidebar-link ${state.page === page ? 'nav-link-active' : ''}" aria-current="${state.page === page ? 'page' : 'false'}">
              <span class="sidebar-link-icon" aria-hidden="true">${icon}</span>
              <span class="sidebar-link-label">${title}</span>
            </a>
          `).join('')}
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-account-chip">
            <div class="mini-avatar">${escapeHTML((state.profile?.full_name || 'V').trim().charAt(0).toUpperCase())}</div>
            <div class="sidebar-account-copy">
              <strong>${escapeHTML(state.profile?.full_name || 'VitalSync user')}</strong>
              <span>Signed in</span>
            </div>
          </div>
          <a href="#" id="logout" class="sidebar-link logout-link">
            <span class="sidebar-link-icon" aria-hidden="true">↪</span>
            <span class="sidebar-link-label">Log out</span>
          </a>
        </div>
      </div>
    </aside>
  `;
}

function MobileHeader() {
  return `
    <header class="mobile-header">
      <button id="mobile-menu-btn" class="mobile-menu-btn" type="button" aria-label="Open navigation" aria-controls="mobile-drawer" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
      <div class="mobile-brand">
        <div class="mobile-logo-wrap">${logo('light')}</div>
      </div>
      <div class="mobile-user-avatar">${escapeHTML((state.profile?.full_name || 'V').trim().charAt(0).toUpperCase())}</div>
    </header>
  `;
}

function MobileDrawer() {
  const links = [
    ['dashboard', 'Dashboard', '⌂'],
    ['chat', 'Daily Check-in', '✓'],
    ['history', 'Health History', '↺'],
    ['reports', 'Clinical Reports', '▣'],
    ['profile', 'Profile', '●'],
    ['account', 'Account & Security', '◈']
  ];

  return `
    <div id="mobile-drawer" class="mobile-drawer" aria-hidden="true">
      <div class="mobile-drawer-backdrop" data-mobile-close></div>
      <aside class="mobile-drawer-panel" role="dialog" aria-modal="true" aria-label="Navigation menu">
        <div class="mobile-drawer-head">
          <div class="sidebar-logo-wrap">${logo('light')}</div>
          <button id="mobile-close-btn" class="mobile-close-btn" type="button" aria-label="Close navigation">×</button>
        </div>
        <div class="mobile-drawer-user">
          <div class="mini-avatar">${escapeHTML((state.profile?.full_name || 'V').trim().charAt(0).toUpperCase())}</div>
          <div class="sidebar-account-copy">
            <strong>${escapeHTML(state.profile?.full_name || 'VitalSync user')}</strong>
            <span>Personal health companion</span>
          </div>
        </div>
        <nav class="mobile-nav" aria-label="Mobile navigation">
          ${links.map(([page, title, icon]) => `
            <a href="#" data-nav="${page}" class="sidebar-link ${state.page === page ? 'nav-link-active' : ''}">
              <span class="sidebar-link-icon" aria-hidden="true">${icon}</span>
              <span class="sidebar-link-label">${title}</span>
            </a>
          `).join('')}
        </nav>
        <a href="#" id="mobile-logout" class="sidebar-link logout-link">
          <span class="sidebar-link-icon" aria-hidden="true">↪</span>
          <span class="sidebar-link-label">Log out</span>
        </a>
      </aside>
    </div>
  `;
}

function appShell(content) {
  return `
    <div class="app-shell">
      ${Sidebar()}
      ${MobileHeader()}
      ${MobileDrawer()}
      <main class="app-main">
        <div class="app-content">
          ${content}
        </div>
      </main>
    </div>
  `;
}


/* =========================================================
   RENDER
========================================================= */

function render() {

  window.__vitalState = state;

  const app = document.getElementById('app');


  if (AUTH_PAGES.has(state.page)) {

    app.innerHTML =
      state.page === 'login'
        ? LoginPage()

        : state.page === 'signup'
        ? SignupPage()

        : state.page === 'forgot'
        ? ForgotPage()

        : state.page === 'email-sent'
        ? EmailSentPage()

        : NewPasswordPage();

    bindAuth();

    return;
  }


  const content =

    state.page === 'dashboard'
      ? dashboardPage(state)

      : state.page === 'chat'
      ? chatPage()

      : state.page === 'history'
      ? historyPage(state)

      : state.page === 'reports'
      ? reportsPage(state)

      : state.page === 'upload-report'
      ? uploadPage()
      : state.page === 'profile'
      ? ProfilePage()

      : AccountPage();


  app.innerHTML = appShell(content);

  bindApp();
}


/* =========================================================
   DATA
========================================================= */

async function loadUserData() {

  state.profile = await getProfile();

  state.logs = await listDailyLogs();

  state.insights = await listInsights();

  state.reports = await listReports();
}


/* =========================================================
   ENTER APPLICATION
========================================================= */

async function enterApp() {

  try {

    const session = await getSession();
    state.email = session?.user?.email || '';
    await loadUserData();

    state.page = 'dashboard';

    state.recoveryFlow = false;

    await loadDashboardState(state);

    render();

  } catch (e) {

    await signOut().catch(() => {});

    state.profile = null;

    state.page = 'login';

    render();

    toast(
      e.message || 'Could not load your account.',
      'error'
    );
  }
}


/* =========================================================
   AUTH HELPERS
========================================================= */

function setAuthBusy(button, busy, text) {

  if (!button) return;

  button.disabled = busy;

  button.dataset.originalText ||= button.textContent;

  button.textContent =
    busy
      ? text
      : button.dataset.originalText;
}


function isRecoveryRedirect() {

  const hash = window.location.hash || '';

  const search = window.location.search || '';

  return /(?:^|[&#?])type=recovery(?:&|$)/i.test(
    hash + search
  );
}


/* =========================================================
   AUTH EVENT HANDLERS
========================================================= */

function bindAuth() {

  document
    .getElementById('signup-link')
    ?.addEventListener('click', () => {

      state.page = 'signup';

      render();
    });


  document
    .getElementById('back-login')
    ?.addEventListener('click', () => {

      state.page = 'login';

      render();
    });


  document
    .getElementById('forgot-link')
    ?.addEventListener('click', () => {

      state.page = 'forgot';

      render();
    });


  document
    .getElementById('forgot-back')
    ?.addEventListener('click', () => {

      state.page = 'login';

      render();
    });


  document
    .getElementById('email-sent-back')
    ?.addEventListener('click', () => {

      state.page = 'login';

      render();
    });


  /* -------------------------------------------------------
     LOGIN
  ------------------------------------------------------- */

  document
    .getElementById('login-form')
    ?.addEventListener('submit', async e => {

      e.preventDefault();

      const button =
        document.getElementById('login-submit');

      setAuthBusy(
        button,
        true,
        'Signing In…'
      );


      try {

        await signIn(
          document
            .getElementById('login-email')
            .value
            .trim(),

          document
            .getElementById('login-password')
            .value
        );


        await enterApp();

      } catch (err) {

        toast(
          friendlyAuthError(err),
          'error'
        );

        setAuthBusy(
          button,
          false
        );
      }

    });


  /* -------------------------------------------------------
     SIGN UP
  ------------------------------------------------------- */

  document
    .getElementById('signup-form')
    ?.addEventListener('submit', async e => {

      e.preventDefault();

      const button =
        document.getElementById('signup-submit');


      const name =
        document
          .getElementById('signup-name')
          .value
          .trim();


      const email =
        document
          .getElementById('signup-email')
          .value
          .trim();


      const password =
        document
          .getElementById('signup-password')
          .value;


      const confirm =
        document
          .getElementById('signup-confirm')
          .value;


      if (!name) {

        return toast(
          'Please enter your full name.',
          'error'
        );
      }


      if (!validatePassword(password)) {

        return toast(
          'Password must be at least 8 characters.',
          'error'
        );
      }


      if (password !== confirm) {

        return toast(
          'Passwords do not match.',
          'error'
        );
      }


      setAuthBusy(
        button,
        true,
        'Creating Account…'
      );


      try {

        const data =
          await signUp(
            name,
            email,
            password
          );


        authState.pendingEmail = email;

        authState.pendingName = name;


        if (data.session) {

          await enterApp();

        } else {

          state.emailAddress = email;

          state.emailFlow = 'signup';

          state.page = 'email-sent';

          render();
        }

      } catch (err) {

        toast(
          friendlyAuthError(err),
          'error'
        );

        setAuthBusy(
          button,
          false
        );
      }

    });


  /* -------------------------------------------------------
     FORGOT PASSWORD
  ------------------------------------------------------- */

  document
    .getElementById('forgot-form')
    ?.addEventListener('submit', async e => {

      e.preventDefault();

      const button =
        document.getElementById('forgot-submit');


      const email =
        document
          .getElementById('forgot-email')
          .value
          .trim();


      if (!email) {

        return toast(
          'Enter your email address.',
          'error'
        );
      }


      setAuthBusy(
        button,
        true,
        'Sending…'
      );


      try {

        await sendRecoveryEmail(email);

        state.emailAddress = email;

        state.emailFlow = 'recovery';

        state.page = 'email-sent';

        render();

      } catch (err) {

        toast(
          friendlyAuthError(err),
          'error'
        );

        setAuthBusy(
          button,
          false
        );
      }

    });


  /* -------------------------------------------------------
     RESEND EMAIL
  ------------------------------------------------------- */

  document
    .getElementById('resend-email')
    ?.addEventListener('click', async e => {

      const button = e.currentTarget;

      setAuthBusy(
        button,
        true,
        'Sending…'
      );


      try {

        if (state.emailFlow === 'signup') {

          await resendSignupEmail(
            state.emailAddress
          );

          toast(
            'A new confirmation email has been sent.'
          );

        } else {

          await sendRecoveryEmail(
            state.emailAddress
          );

          toast(
            'A new password reset email has been sent.'
          );
        }

      } catch (err) {

        toast(
          friendlyAuthError(err),
          'error'
        );

      } finally {

        setAuthBusy(
          button,
          false
        );
      }

    });


  /* -------------------------------------------------------
     NEW PASSWORD
  ------------------------------------------------------- */

  document
    .getElementById('new-password-form')
    ?.addEventListener('submit', async e => {

      e.preventDefault();


      const button =
        document.getElementById(
          'update-password-btn'
        );


      const currentPassword =
        document
          .getElementById('current-password')
          ?.value || '';


      const password =
        document
          .getElementById('new-password')
          .value;


      const confirm =
        document
          .getElementById('new-password-confirm')
          .value;


      if (!state.recoveryFlow && !currentPassword) {

        return toast(
          'Enter your current password.',
          'error'
        );
      }


      if (!validatePassword(password)) {

        return toast(
          'Password must be at least 8 characters.',
          'error'
        );
      }


      if (password !== confirm) {

        return toast(
          'Passwords do not match.',
          'error'
        );
      }


      setAuthBusy(
        button,
        true,
        'Updating…'
      );


      try {

        await updatePassword(
          password,
          currentPassword
        );


        toast(
          'Password updated successfully.'
        );


        state.recoveryFlow = false;

        await enterApp();

      } catch (err) {

        toast(
          friendlyAuthError(err),
          'error'
        );

        setAuthBusy(
          button,
          false
        );
      }

    });
}


/* =========================================================
   APP EVENTS
========================================================= */

function closeMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  const button = document.getElementById('mobile-menu-btn');

  drawer?.classList.remove('is-open');
  drawer?.setAttribute('aria-hidden', 'true');
  button?.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('mobile-menu-open');
}

function openMobileMenu() {
  const drawer = document.getElementById('mobile-drawer');
  const button = document.getElementById('mobile-menu-btn');

  drawer?.classList.add('is-open');
  drawer?.setAttribute('aria-hidden', 'false');
  button?.setAttribute('aria-expanded', 'true');
  document.body.classList.add('mobile-menu-open');
}

function bindApp() {

  document
    .querySelectorAll('[data-nav]')
    .forEach(el => {

      el.addEventListener('click', e => {

        e.preventDefault();

        closeMobileMenu();

        navigate(
          el.dataset.nav
        );
      });

    });

  document
    .getElementById('mobile-menu-btn')
    ?.addEventListener('click', () => {
      const drawer = document.getElementById('mobile-drawer');
      if (drawer?.classList.contains('is-open')) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });

  document
    .getElementById('mobile-close-btn')
    ?.addEventListener('click', closeMobileMenu);

  document
    .querySelectorAll('[data-mobile-close]')
    .forEach(el => el.addEventListener('click', closeMobileMenu));

  document
    .getElementById('mobile-logout')
    ?.addEventListener('click', async e => {
      e.preventDefault();
      closeMobileMenu();
      await signOut().catch(() => {});

      state.profile = null;
      state.logs = [];
      state.insights = [];
      state.reports = [];
      state.email = '';
      state.page = 'login';
      render();
    });

  document.onkeydown = e => {
    if (e.key === 'Escape') closeMobileMenu();
  };


  document
    .getElementById('logout')
    ?.addEventListener('click', async e => {

      e.preventDefault();

      await signOut().catch(() => {});

      state.profile = null;
      state.logs = [];
      state.insights = [];
      state.reports = [];
      state.email = '';

      state.page = 'login';

      render();
    });


  /* -------------------------------------------------------
     CHAT
  ------------------------------------------------------- */

  if (state.page === 'chat') {

    document
      .getElementById('send-btn')
      ?.addEventListener(
        'click',
        () => sendMessage(render)
      );


    document
      .getElementById('user-input')
      ?.addEventListener(
        'keydown',
        e => {

          if (e.key === 'Enter') {

            sendMessage(render);
          }

        }
      );


    document
      .getElementById('clear-today-small')
      ?.addEventListener(
        'click',
        () => {

          clearToday(
            state,
            () => {

              resetChat();

              render();
            }
          );
        }
      );


    setTimeout(
      () =>
        document
          .getElementById('chat-end')
          ?.scrollIntoView({
            behavior: 'smooth'
          }),
      30
    );
  }


  /* -------------------------------------------------------
     HISTORY
  ------------------------------------------------------- */

  if (state.page === 'history') {

    document
      .getElementById('daily-report-btn')
      ?.addEventListener(
        'click',
        () =>
          generateReport(
            'daily',
            state,
            render
          )
      );


    document
      .getElementById('weekly-report-btn')
      ?.addEventListener(
        'click',
        () =>
          generateReport(
            'weekly',
            state,
            render
          )
      );


    document
      .getElementById('clear-today-btn')
      ?.addEventListener(
        'click',
        () =>
          clearToday(
            state,
            render
          )
      );


    document
      .getElementById('clear-all-btn')
      ?.addEventListener(
        'click',
        () =>
          clearAll(
            state,
            render
          )
      );
  }


  /* -------------------------------------------------------
     UPLOAD REPORT
  ------------------------------------------------------- */

  if (state.page === 'upload-report') {

    const box =
      document.getElementById('upload-box');

    const input =
      document.getElementById('file-input');


    box?.addEventListener(
      'click',
      () => input?.click()
    );


    input?.addEventListener(
      'change',
      e =>
        handleUpload(
          e.target.files[0],
          state,
          render
        )
    );


    box?.addEventListener(
      'dragover',
      e => e.preventDefault()
    );


    box?.addEventListener(
      'drop',
      e => {

        e.preventDefault();

        handleUpload(
          e.dataTransfer.files[0],
          state,
          render
        );
      }
    );


    document
      .getElementById('analyze-uploaded')
      ?.addEventListener(
        'click',
        () =>
          analyzeSelected(
            state,
            render
          )
      );
  }


  /* -------------------------------------------------------
     REPORTS
  ------------------------------------------------------- */

  if (state.page === 'reports') {

    document
      .querySelectorAll('[data-analyze]')
      .forEach(el => {

        el.addEventListener(
          'click',
          () =>
            analyzeReportById(
              el.dataset.analyze,
              state,
              render
            )
        );
      });


    document
      .querySelectorAll('[data-delete-report]')
      .forEach(el => {

        el.addEventListener(
          'click',
          () =>
            removeReport(
              el.dataset.deleteReport,
              state,
              render
            )
        );
      });
  }


  /* -------------------------------------------------------
     PROFILE
  ------------------------------------------------------- */

  if (state.page === 'profile') {
    const dob = document.getElementById('p-date_of_birth');
    const height = document.getElementById('p-height_cm');
    const weight = document.getElementById('p-weight_kg');
    const ageField = document.getElementById('p-age');
    const ageValue = document.getElementById('profile-age-value');
    const bmiField = document.getElementById('p-bmi');
    const bmiValue = document.getElementById('profile-bmi-value');

    const refreshCalculated = () => {
      const age = calculateAge(dob?.value);
      const bmi = calculateBMI(height?.value, weight?.value);
      if (ageField) ageField.value = age;
      if (ageValue) ageValue.textContent = age || '—';
      if (bmiField) bmiField.value = bmi;
      if (bmiValue) bmiValue.textContent = bmi || '—';
    };

    dob?.addEventListener('change', refreshCalculated);
    height?.addEventListener('input', refreshCalculated);
    weight?.addEventListener('input', refreshCalculated);

    document.getElementById('full-profile-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const button = document.getElementById('save-full-profile');
      setAuthBusy(button, true, 'Saving…');

      const value = id => document.getElementById(id)?.value ?? '';
      try {
        state.profile = await saveProfile({
          full_name: value('p-full_name'),
          date_of_birth: value('p-date_of_birth'),
          gender: value('p-gender'),
          phone: value('p-phone'),
          height_cm: value('p-height_cm'),
          weight_kg: value('p-weight_kg'),
          blood_group: value('p-blood_group'),
          allergies: value('p-allergies'),
          medical_conditions: value('p-medical_conditions'),
          medications: value('p-medications'),
          previous_surgeries: value('p-previous_surgeries'),
          family_medical_history: value('p-family_medical_history'),
          emergency_contact_name: value('p-emergency_contact_name'),
          emergency_contact_phone: value('p-emergency_contact_phone'),
          emergency_contact_relationship: value('p-emergency_contact_relationship'),
          smoking_status: value('p-smoking_status'),
          alcohol_use: value('p-alcohol_use'),
          activity_level: value('p-activity_level'),
          diet_preference: value('p-diet_preference'),
          occupation: value('p-occupation'),
          location: value('p-location'),
          primary_doctor: value('p-primary_doctor'),
          medical_notes: value('p-medical_notes')
        });
        toast('Profile saved securely.');
        render();
      } catch (err) {
        toast(err.message || 'Could not save profile.', 'error');
        setAuthBusy(button, false);
      }
    });
  }

  /* -------------------------------------------------------
     ACCOUNT / SECURITY
  ------------------------------------------------------- */

  if (state.page === 'account') {
    document.getElementById('change-password-btn')?.addEventListener('click', () => {
      state.recoveryFlow = false;
      state.page = 'new-password';
      render();
    });
  }

}


/* =========================================================
   NAVIGATION
========================================================= */

async function navigate(page) {

  closeMobileMenu();

  if (page === 'chat') {

    resetChat();
  }

  state.page = page;

  render();
}

window.__navigate = navigate;


/* =========================================================
   SUPABASE AUTH EVENTS
========================================================= */

supabase.auth.onAuthStateChange(
  (event, session) => {

    if (event === 'SIGNED_OUT') {

      state.page = 'login';

      state.profile = null;

      state.recoveryFlow = false;

      render();

      return;
    }


    /*
     * When a user clicks the password-reset email link,
     * Supabase establishes a recovery session and emits
     * PASSWORD_RECOVERY.
     */
    if (event === 'PASSWORD_RECOVERY') {

      state.recoveryFlow = true;

      state.page = 'new-password';

      render();

      return;
    }


    /*
     * Clicking the normal signup confirmation link creates
     * a valid session. Send the user into VitalSync.
     */
    if (
      event === 'SIGNED_IN' &&
      session &&
      ['login', 'signup', 'email-sent'].includes(state.page)
    ) {

      enterApp();
    }
  }
);


/* =========================================================
   INITIALIZATION
========================================================= */

(async () => {

  try {

    const session =
      await getSession();


    if (!session) {

      render();

      return;
    }


    /*
     * Do not send a recovery-link user directly to the
     * dashboard. Let them choose their new password first.
     */
    if (
      isRecoveryRedirect() ||
      state.recoveryFlow
    ) {

      state.recoveryFlow = true;

      state.page = 'new-password';

      render();

      return;
    }


    await enterApp();

  } catch {

    render();
  }

})();