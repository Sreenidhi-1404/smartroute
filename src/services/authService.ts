import { UserAccount, UserRole } from '../types';
import { storageService } from './storageService';

const AUTH_SESSION_KEY = 'smartroute_session_token_v4';

export const authService = {
  // Use the centralized accounts store
  getAccounts(): UserAccount[] {
    return storageService.getUserAccounts();
  },

  // Authenticate user with email and password
  login(email: string, password: string): { success: boolean; user?: UserAccount; message?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    const accounts = this.getAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      return {
        success: false,
        message: 'No registered school account found with this email. Please check your spelling.',
      };
    }

    if (account.status !== 'Active') {
      return {
        success: false,
        message: 'This account has been deactivated. Please contact Kovai Valley transport administration.',
      };
    }

    // Verify password credential
    if (account.passwordHash !== cleanPass) {
      return {
        success: false,
        message: 'Incorrect password. Please verify your credentials or use the demo login information.',
      };
    }

    // Generate simulated session token
    const sessionData = {
      token: `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: account.id,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      user: account,
    };

    localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(sessionData));
    return { success: true, user: account };
  },

  // Get current active session user. Returns NULL if not authenticated!
  getCurrentUser(): UserAccount | null {
    try {
      const raw = localStorage.getItem(AUTH_SESSION_KEY);
      if (!raw) return null; // CRITICAL: Never default to any user!

      const session = JSON.parse(raw);
      if (!session || !session.expiresAt || session.expiresAt < Date.now()) {
        localStorage.removeItem(AUTH_SESSION_KEY);
        return null;
      }

      // Re-verify account in storage
      const accounts = this.getAccounts();
      const account = accounts.find(a => a.id === session.userId);
      if (!account || account.status !== 'Active') {
        localStorage.removeItem(AUTH_SESSION_KEY);
        return null;
      }
      return account;
    } catch (e) {
      console.error('Error reading session:', e);
      return null;
    }
  },

  // Logout - destroys the session completely
  logout(): void {
    localStorage.removeItem(AUTH_SESSION_KEY);
  },

  // Simulated password reset
  requestPasswordReset(email: string): { success: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const accounts = this.getAccounts();
    const account = accounts.find(a => a.email.toLowerCase() === cleanEmail);

    if (!account) {
      return {
        success: false,
        message: 'No registered account found with that email address at Kovai Valley Matriculation School.',
      };
    }

    return {
      success: true,
      message: `Password reset instructions and verification code have been dispatched to ${email}.`,
    };
  },
};
