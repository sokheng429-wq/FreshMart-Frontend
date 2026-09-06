import { useState } from 'react';
import { BACKEND_URL } from '../api/api';

const TELEGRAM_BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || 'FreshMartBot';
const API_BASE_URL = BACKEND_URL;
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 150; // 5 minutes

/**
 * Telegram login hook using Bot Deep Link method.
 *
 * Flow:
 * 1. User clicks button -> creates session token
 * 2. Opens https://t.me/FreshMartbot?start={token}
 * 3. User taps "Start" in Telegram
 * 4. Bot webhook processes /start command
 * 5. Frontend polls until status = COMPLETED
 * 6. Receives JWT and calls onAuth
 */
export function useTelegramLogin({ onAuth, onError }) {
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState(null);

  const handleTelegramLogin = async () => {
    try {
      setError(null);
      setIsPolling(true);

      console.log('[Telegram Login] Initializing session...');

      // Step 1: Create login session
      const initResponse = await fetch(`${API_BASE_URL}/api/auth/telegram/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initialize Telegram login');
      }

      const initData = await initResponse.json();
      console.log('[Telegram Login] Init response:', initData);

      if (!initData.success || !initData.data?.token) {
        throw new Error(initData.message || 'Invalid response from server');
      }

      const sessionToken = initData.data.token;
      console.log('[Telegram Login] Session token:', sessionToken);

      // Step 2: Open Telegram bot with deep link
      const deepLink = `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${sessionToken}`;
      console.log('[Telegram Login] Opening deep link:', deepLink);

      const telegramWindow = window.open(deepLink, '_blank');
      if (!telegramWindow) {
        throw new Error('Please allow pop-ups to login with Telegram');
      }

      // Step 3: Poll for completion
      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;

        if (attempts > MAX_POLL_ATTEMPTS) {
          clearInterval(pollInterval);
          setIsPolling(false);
          const timeoutError = new Error('Login timeout - please try again');
          setError(timeoutError.message);
          onError?.(timeoutError);
          return;
        }

        try {
          const statusResponse = await fetch(
            `${API_BASE_URL}/api/auth/telegram/status/${sessionToken}`
          );

          if (!statusResponse.ok) {
            throw new Error('Failed to check login status');
          }

          const statusData = await statusResponse.json();

          if (attempts % 10 === 0) {
            console.log(`[Telegram Login] Poll attempt ${attempts}, status:`, statusData.data?.status);
          }

          if (statusData.success && statusData.data) {
            const { status, token, tokenType, user, jwt, telegramUserId, telegramUsername } = statusData.data;

            if (status === 'COMPLETED' && (token || jwt)) {
              clearInterval(pollInterval);
              setIsPolling(false);
              console.log('[Telegram Login] Success! User:', user || { telegramUserId, telegramUsername });

              // Pass the complete backend response to onAuth
              onAuth(statusData.data);
            } else if (status === 'EXPIRED') {
              clearInterval(pollInterval);
              setIsPolling(false);
              const expiredError = new Error('Session expired - please try again');
              setError(expiredError.message);
              onError?.(expiredError);
            }
          }
        } catch (pollError) {
          console.error('[Telegram Login] Polling error:', pollError);
        }
      }, POLL_INTERVAL_MS);

    } catch (err) {
      console.error('[Telegram Login] Error:', err);
      setIsPolling(false);
      setError(err.message || 'Login failed');
      onError?.(err);
    }
  };

  return {
    handleTelegramLogin,
    isPolling,
    error,
    // Empty ref for compatibility with your button overlay pattern
    telegramButtonRef: { current: null }
  };
}
