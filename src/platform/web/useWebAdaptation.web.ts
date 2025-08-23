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
          
          /* 禁用移动端键盘弹起时的页面下沉/位移效果 - 强化版 */
          .force-mobile-layout input, 
          .force-mobile-layout textarea {
            transform: none !important;
            -webkit-transform: none !important;
            -moz-transform: none !important;
            -ms-transform: none !important;
            -o-transform: none !important;
            transition: none !important;
            -webkit-transition: none !important;
            -moz-transition: none !important;
            -ms-transition: none !important;
            -o-transition: none !important;
            position: relative !important;
            animation: none !important;
            -webkit-animation: none !important;
          }
          
          /* 阻止输入框焦点时的页面滚动行为 - 强化版 */
          .force-mobile-layout input:focus,
          .force-mobile-layout textarea:focus {
            scroll-behavior: auto !important;
            transform: none !important;
            -webkit-transform: none !important;
            -moz-transform: none !important;
            -ms-transform: none !important;
            -o-transform: none !important;
            transition: none !important;
            -webkit-transition: none !important;
            -moz-transition: none !important;
            -ms-transition: none !important;
            -o-transition: none !important;
            animation: none !important;
            -webkit-animation: none !important;
          }
          
          /* 针对Android Chrome的特殊修复 */
          @supports (-webkit-touch-callout: none) {
            .force-mobile-layout input,
            .force-mobile-layout textarea {
              -webkit-transform: translate3d(0, 0, 0) !important;
              transform: translate3d(0, 0, 0) !important;
            }
          }
          
          /* 禁用webkit在输入时的自动缩放和位移 - 强化版 */
          @media screen and (-webkit-min-device-pixel-ratio: 0) {
            .force-mobile-layout input,
            .force-mobile-layout textarea {
              -webkit-transform: none !important;
              transform: none !important;
            }
            
            .force-mobile-layout input:focus,
            .force-mobile-layout textarea:focus {
              -webkit-transform: none !important;
              transform: none !important;
            }
          }
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

      // Apply global UI scale (font + all UI) via CSS transform
      try {
        const params = new URLSearchParams(window.location.search);
        const paramScale = params.get('scale');
        const envScale = (process.env.EXPO_PUBLIC_UI_SCALE as string) || '';
        // Prefer URL param > env > sensible default on mobile
        const defaultScale = window.innerWidth <= 768 ? '0.92' : '0.95';
        const scale = (paramScale && /^0?\.\d+$|^1(\.0+)?$/.test(paramScale))
          ? paramScale
          : (envScale && /^0?\.\d+$|^1(\.0+)?$/.test(envScale))
            ? envScale
            : defaultScale;

        // Write CSS variable for global.css consumption
        document.documentElement.style.setProperty('--ui-scale', scale);
      } catch {}

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
