export const telegram = {
  webApp: () => window.Telegram?.WebApp,
  initData: () => window.Telegram?.WebApp?.initData || '',
  user: () => window.Telegram?.WebApp?.initDataUnsafe?.user || null,
  startParam: () => window.Telegram?.WebApp?.initDataUnsafe?.start_param || '',
  ready() { const tg=this.webApp(); tg?.ready?.(); tg?.expand?.(); },
  haptic(style='light') { this.webApp()?.HapticFeedback?.impactOccurred?.(style); },
  notify(style='success') { this.webApp()?.HapticFeedback?.notificationOccurred?.(style); },
  openLink(url:string) { this.webApp()?.openTelegramLink?.(url); }
};
