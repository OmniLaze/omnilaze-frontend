// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  
  // 超时设置
  timeout: 60 * 1000,
  
  // 期望超时
  expect: {
    timeout: 10000
  },
  
  // 完全并行
  fullyParallel: false,
  
  // 失败时重试
  retries: 0,
  
  // 并行工作器数
  workers: 1,
  
  // 报告器
  reporter: 'list',
  
  // 使用配置
  use: {
    // 基础URL
    baseURL: 'http://localhost:8082',
    
    // 截图
    screenshot: 'only-on-failure',
    
    // 视频
    video: 'retain-on-failure',
    
    // 追踪
    trace: 'on-first-retry',
    
    // 慢动作
    slowMo: 500,
    
    // 无头模式
    headless: false,
  },

  // 配置项目
  projects: [
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['iPhone 12'],
        locale: 'zh-CN',
        channel: 'chromium',  // 强制使用chromium
      },
    },
    {
      name: 'Chromium Mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15',
        isMobile: true,
        hasTouch: true,
        locale: 'zh-CN',
      },
    },
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
        locale: 'zh-CN',
      },
    },
  ],
});