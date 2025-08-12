import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform } from 'react-native';

interface WebPortalProps {
  children: React.ReactNode;
  isVisible: boolean;
}

export const WebPortal: React.FC<WebPortalProps> = ({ children, isVisible }) => {
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && isVisible) {
      // 创建或获取portal容器
      let portal = document.getElementById('autocomplete-portal');
      if (!portal) {
        portal = document.createElement('div');
        portal.id = 'autocomplete-portal';
        portal.style.position = 'fixed';
        portal.style.top = '0';
        portal.style.left = '0';
        portal.style.zIndex = '99999';
        portal.style.pointerEvents = 'none';
        document.body.appendChild(portal);
      }
      setPortalRoot(portal);
    } else {
      setPortalRoot(null);
    }
  }, [isVisible]);

  if (Platform.OS !== 'web' || !isVisible || !portalRoot) {
    return null;
  }

  return createPortal(children, portalRoot);
};