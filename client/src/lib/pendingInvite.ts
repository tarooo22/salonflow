export const PENDING_INVITE_STORAGE_KEY = "salonflow.pendingInviteToken";

export function getPendingInviteToken() {
  try {
    return sessionStorage.getItem(PENDING_INVITE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function rememberPendingInviteToken(token: string) {
  try {
    sessionStorage.setItem(PENDING_INVITE_STORAGE_KEY, token);
  } catch {}
}

export function clearPendingInviteToken() {
  try {
    sessionStorage.removeItem(PENDING_INVITE_STORAGE_KEY);
  } catch {}
}

export function pendingInvitePath(): string | null {
  const token = getPendingInviteToken();
  return token && /^[A-Za-z0-9_-]{32,128}$/.test(token) ? `/invite/${token}` : null;
}
