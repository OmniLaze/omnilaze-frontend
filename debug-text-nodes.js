const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true  // 打开开发者工具
  });
  const page = await browser.newPage();
  
  // 拦截控制台错误并分析
  const errorMap = new Map();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Unexpected text node')) {
        // 统计错误
        const count = errorMap.get('text-node') || 0;
        errorMap.set('text-node', count + 1);
      }
    }
  });
  
  console.log('正在访问页面...');
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle' });
  
  // 等待一会儿收集错误
  await page.waitForTimeout(3000);
  
  console.log('\n=== 错误统计 ===');
  console.log(`Text node errors: ${errorMap.get('text-node') || 0}`);
  
  // 尝试在页面上执行代码来找到问题源
  const analysis = await page.evaluate(() => {
    // 查找所有的 View 组件
    const views = document.querySelectorAll('[class*="css-view"]');
    const problematicViews = [];
    
    views.forEach(view => {
      // 检查直接子节点
      for (const child of view.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.textContent || '';
          if (text.trim()) {
            problematicViews.push({
              text: text.trim(),
              parentClass: view.className,
              parentId: view.id || 'no-id',
              // 获取一些父元素的信息
              ancestors: (() => {
                const ancestors = [];
                let parent = view.parentElement;
                let depth = 0;
                while (parent && depth < 3) {
                  ancestors.push({
                    tag: parent.tagName,
                    class: parent.className?.substring(0, 50),
                    id: parent.id
                  });
                  parent = parent.parentElement;
                  depth++;
                }
                return ancestors;
              })()
            });
          }
        }
      }
    });
    
    return problematicViews;
  });
  
  console.log('\n=== 发现的问题节点 ===');
  if (analysis.length > 0) {
    // 只显示前10个
    analysis.slice(0, 10).forEach(item => {
      console.log(`\nText: "${item.text}"`);
      console.log(`Parent Class: ${item.parentClass}`);
      console.log(`Ancestors:`, item.ancestors);
    });
    console.log(`\n总共发现 ${analysis.length} 个问题节点`);
  } else {
    console.log('没有发现直接的文本节点问题');
  }
  
  // 检查特定的组件
  const componentCheck = await page.evaluate(() => {
    // 检查是否有某些特定的模式
    const allElements = document.querySelectorAll('*');
    const suspiciousPatterns = [];
    
    allElements.forEach(el => {
      const text = el.textContent || '';
      // 检查是否有大量的句点
      if (text === '.' || text === '...' || text === '..') {
        suspiciousPatterns.push({
          text,
          tag: el.tagName,
          class: el.className?.substring(0, 100)
        });
      }
    });
    
    return suspiciousPatterns;
  });
  
  if (componentCheck.length > 0) {
    console.log('\n=== 可疑的句点模式 ===');
    const grouped = {};
    componentCheck.forEach(item => {
      const key = `${item.text} - ${item.class}`;
      grouped[key] = (grouped[key] || 0) + 1;
    });
    
    Object.entries(grouped).forEach(([key, count]) => {
      console.log(`${key}: ${count} 次`);
    });
  }
  
  // 保持浏览器打开
  console.log('\n浏览器将在20秒后关闭，你可以在开发者工具中进一步调试...');
  await page.waitForTimeout(20000);
  
  await browser.close();
})();