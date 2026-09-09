export const telegram = {
  webApp: () => window.Telegram?.WebApp,
  initData: () => window.Telegram?.WebApp?.initData || '',
  user: () => window.Telegram?.WebApp?.initDataUnsafe?.user || null,
  startParam: () => window.Telegram?.WebApp?.initDataUnsafe?.start_param || '',
  ready() { const tg=this.webApp(); tg?.ready?.(); tg?.expand?.(); },
  haptic(style='light') { this.webApp()?.HapticFeedback?.impactOccurred?.(style); },
  select() { this.webApp()?.HapticFeedback?.selectionChanged?.(); },
  notify(style='success') { this.webApp()?.HapticFeedback?.notificationOccurred?.(style); },
  openLink(url:string) { this.webApp()?.openTelegramLink?.(url); },
  async share(url:string,text:string) {
    this.haptic('light');
    if (navigator.share) {
      try { await navigator.share({url,text,title:'V I B E'}); return true; } catch { /* user cancelled or unavailable */ }
    }
    const shareUrl=`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    const tg=this.webApp();
    if(tg?.openTelegramLink){tg.openTelegramLink(shareUrl);return true;}
    window.open(shareUrl,'_blank','noopener,noreferrer');
    return true;
  }
};
