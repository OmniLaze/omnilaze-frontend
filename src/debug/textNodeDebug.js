// 临时调试脚本，用于查找 React Native 中的文本节点问题

const originalConsoleError = console.error;
let errorCount = 0;
let lastErrorTime = Date.now();

console.error = function(...args) {
  const message = args[0]?.toString() || '';
  
  if (message.includes('Unexpected text node')) {
    errorCount++;
    const now = Date.now();
    
    // 每秒只打印一次汇总信息
    if (now - lastErrorTime > 1000) {
      console.log(`[Text Node Errors] ${errorCount} errors in the last second`);
      
      // 尝试获取更多错误上下文
      if (args[1] && typeof args[1] === 'object') {
        console.log('[Error Context]:', JSON.stringify(args[1], null, 2));
      }
      
      // 获取调用栈
      try {
        throw new Error('Stack trace');
      } catch (e) {
        const stack = e.stack?.split('\n').slice(2, 5).join('\n');
        console.log('[Call Stack]:', stack);
      }
      
      errorCount = 0;
      lastErrorTime = now;
    }
    
    // 不要传递这个错误到原始 console.error，避免刷屏
    return;
  }
  
  // 其他错误正常显示
  originalConsoleError.apply(console, args);
};

// 5分钟后恢复原始 console.error
setTimeout(() => {
  console.error = originalConsoleError;
  console.log('[Debug] Text node error monitoring stopped');
}, 5 * 60 * 1000);

console.log('[Debug] Text node error monitoring started');