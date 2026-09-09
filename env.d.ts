/// <reference types="vite/client" />

interface Window {
  Telegram?: {
    WebApp?: {
      initData?: string;
      initDataUnsafe?: { user?: TelegramWebAppUser; start_param?: string };
      ready?: () => void;
      expand?: () => void;
      close?: () => void;
      openTelegramLink?: (url: string) => void;
      HapticFeedback?: { impactOccurred?: (style: string) => void; notificationOccurred?: (style: string) => void };
    };
  };
}
interface TelegramWebAppUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
}
