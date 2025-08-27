import React, { useEffect } from 'react';
import { View } from 'react-native';

// 调试组件：监控文本节点错误
export const TextNodeDebugger: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const originalError = console.error;
    let errorCount = 0;
    let lastReportTime = Date.now();
    
    console.error = function(...args) {
      const message = args[0]?.toString() || '';
      
      if (message.includes('Unexpected text node')) {
        errorCount++;
        const now = Date.now();
        
        // 每5秒报告一次
        if (now - lastReportTime > 5000) {
          console.log(`[TextNodeDebugger] ${errorCount} text node errors in the last 5 seconds`);
          
          // 尝试找到问题源
          try {
            const views = document.querySelectorAll('[class*="css-view"]');
            let problemFound = false;
            
            views.forEach(view => {
              for (const child of view.childNodes) {
                if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
                  if (!problemFound) {
                    console.log('[TextNodeDebugger] Found text node in View:', {
                      text: child.textContent,
                      parentClass: view.className,
                      parentHTML: view.outerHTML.substring(0, 200)
                    });
                    problemFound = true;
                  }
                }
              }
            });
          } catch (e) {
            // 忽略错误
          }
          
          errorCount = 0;
          lastReportTime = now;
        }
        
        return; // 不传递到原始 console.error
      }
      
      originalError.apply(console, args);
    };
    
    return () => {
      console.error = originalError;
    };
  }, []);
  
  return <>{children}</>;
};