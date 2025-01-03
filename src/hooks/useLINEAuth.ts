import { useEffect, useState, useCallback } from 'react';
import liff from '@line/liff';
import axios from 'axios';
import { toast } from 'react-toastify';
import { UserProfile, VerifyResponse } from '../types';

const VERIFY_API_URL = import.meta.env.VITE_VERIFY_API_URL as string;
const LIFF_ID = import.meta.env.VITE_LIFF_ID as string;

export const useLINEAuth = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const verifyToken = useCallback(async (accessToken: string): Promise<UserProfile> => {
    try {
      const response = await axios.post<VerifyResponse>(VERIFY_API_URL, { access_token: accessToken });
      if (!response.data.success || !response.data.user) {
        throw new Error(response.data.message || 'Verification failed');
      }
      return response.data.user;
    } catch (error) {
      const errorMessage = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : 'Verification error';
      throw new Error(errorMessage);
    }
  }, []);

  const fetchUserProfile = useCallback(async (): Promise<void> => {
    try {
      const accessToken = liff.getAccessToken();
      if (!accessToken) {
        throw new Error('Access token not found');
      }
      const userProfile = await verifyToken(accessToken);
      setProfile(userProfile);
      setIsLoggedIn(true);
    } catch (err) {
      setError(`Error fetching profile: ${err instanceof Error ? err.message : String(err)}`);
      toast.error(`Error fetching profile: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [verifyToken]);

  const initializeLiff = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      await liff.init({ liffId: LIFF_ID });
      setIsInitialized(true);
      if (liff.isLoggedIn()) {
        await fetchUserProfile();
      }
    } catch (err) {
      setError(`Error initializing LIFF: ${err instanceof Error ? err.message : String(err)}`);
      toast.error(`Error initializing LIFF: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserProfile]);

  useEffect(() => {
    void initializeLiff();
  }, [initializeLiff]);

  const login = useCallback((): void => {
    if (!liff.isLoggedIn()) {
      liff.login();
    }
  }, []);

  const logout = useCallback((): void => {
    if (liff.isLoggedIn()) {
      liff.logout();
      setIsLoggedIn(false);
      setProfile(null);
    }
  }, []);

  const shareMessage = useCallback(async (): Promise<void> => {
    if (!liff.isLoggedIn() || !liff.isApiAvailable('shareTargetPicker')) {
      throw new Error('Share target picker is not available.');
    }
    try {
      await liff.shareTargetPicker([
        {
          type: 'text',
          text: `Check this out: ${window.location.href}`,
        },
      ]);
    } catch (err) {
      throw new Error(`Error sending message: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, []);

  return {
    profile,
    error,
    isLoggedIn,
    isInitialized,
    isLoading,
    login,
    logout,
    shareMessage,
    setError
  };
};
