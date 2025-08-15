import { useEffect } from 'react';
import { Platform } from 'react-native';
import { CookieManager } from '../../utils/cookieManager';

// Encapsulate web-only adaptation logic to keep App clean and RN-pure
export function useWebAdaptation() {
  // Support reset via URL param: ?reset=1
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('reset') === '1') {
        // Clear session and conversation state
        try { CookieManager.clearSession(); } catch {}
        try { CookieManager.clearConversationState(); } catch {}
        try { localStorage.removeItem('user_id'); } catch {}
        try { localStorage.removeItem('phone_number'); } catch {}
        try { localStorage.removeItem('omnilaze_focus_mode'); } catch {}
        // Clean URL and reload
        params.delete('reset');
        const base = window.location.origin + window.location.pathname;
        const qs = params.toString();
        window.location.replace(qs ? `${base}?${qs}` : base);
      }
    } catch {}
  }, []);

  // Viewport + mobile layout/text-size adaptation
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof document === 'undefined' || typeof window === 'undefined') return;
    try {
      const existingViewport = document.querySelector('meta[name="viewport"]');
      if (existingViewport) {
        existingViewport.setAttribute(
          'content',
          'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover'
        );
      }

      const isMobileDevice = () =>
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator?.userAgent || ''
        ) ||
        window.innerWidth <= 768 ||
        'ontouchstart' in window ||
        ((navigator as any)?.maxTouchPoints && (navigator as any).maxTouchPoints > 0);

      if (isMobileDevice()) {
        document.documentElement.classList.add('force-mobile');
        document.body.classList.add('force-mobile-layout');

        const mobileStyle = document.createElement('style');
        mobileStyle.id = 'mobile-adaptation';
        mobileStyle.textContent = `
          html.force-mobile, body.force-mobile-layout { width: 100vw !important; max-width: 100vw !important; overflow-x: hidden !important; }
          .force-mobile-layout * { max-width: 100vw !important; box-sizing: border-box !important; }
          .force-mobile-layout { -webkit-touch-callout: none; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
        `;
        const oldStyle = document.getElementById('mobile-adaptation');
        if (oldStyle) oldStyle.remove();
        document.head.appendChild(mobileStyle);
      }

      document.documentElement.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
      document.documentElement.style.setProperty('-moz-text-size-adjust', '100%', 'important');
      document.documentElement.style.setProperty('text-size-adjust', '100%', 'important');
      document.body.style.setProperty('-webkit-text-size-adjust', '100%', 'important');
      document.body.style.setProperty('-moz-text-size-adjust', '100%', 'important');
      document.body.style.setProperty('text-size-adjust', '100%', 'important');

      const handleResize = () => {
        if (window.innerWidth <= 768) {
          document.body.classList.add('force-mobile-layout');
        } else {
          document.body.classList.remove('force-mobile-layout');
        }
      };
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    } catch (err) {
      console.warn('Web adaptation skipped:', err);
    }
  }, []);
}
