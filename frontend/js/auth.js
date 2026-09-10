import { supabase } from './supabase.js';
import { getAppUrl } from './utils.js';

export const authState = {
  pendingEmail: '',
  pendingName: ''
};

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signUp(fullName, email, password) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName
      },
      emailRedirectTo: getAppUrl()
    }
  });

  if (error) {
    throw error;
  }

  authState.pendingEmail = email;
  authState.pendingName = fullName;

  return data;
}

export async function resendSignupEmail(email) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    emailRedirectTo: getAppUrl()
  });

  if (error) {
    throw error;
  }
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function sendRecoveryEmail(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAppUrl()
  });

  if (error) {
    throw error;
  }

  authState.pendingEmail = email;
}

export async function updatePassword(password, currentPassword = '') {
  const attributes = {
    password
  };

  /*
   * For normal password changes, the user enters their current password.
   * For password recovery, Supabase has already authenticated the
   * user through the reset link, so currentPassword is empty.
   */
  if (currentPassword) {
    attributes.current_password = currentPassword;
  }

  const { data, error } = await supabase.auth.updateUser(attributes);

  if (error) {
    throw error;
  }

  return data;
}

export function validatePassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

export function friendlyAuthError(error) {
  const message = error?.message || 'Something went wrong.';

  if (/invalid login credentials/i.test(message)) {
    return 'Email or password is incorrect.';
  }

  if (/email not confirmed/i.test(message)) {
    return 'Please open the confirmation email and click the verification link before signing in.';
  }

  if (/password.*(current|incorrect)|current_password/i.test(message)) {
    return 'Your current password is incorrect.';
  }

  if (/reauthentication_needed/i.test(message)) {
    return 'Please sign in again before changing your password.';
  }

  if (/rate limit|too many requests/i.test(message)) {
    return 'Too many attempts. Please wait a little and try again.';
  }

  return message;
}