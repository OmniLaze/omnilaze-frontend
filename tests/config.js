// 测试配置文件
module.exports = {
  // 基础配置
  baseUrl: process.env.FRONTEND_URL || 'http://localhost:8081',
  backendUrl: process.env.BACKEND_URL || 'http://localhost:3000',
  
  // 数据库配置
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/omnilaze',
  
  // 测试账号
  testAccount: {
    phoneNumber: process.env.TEST_PHONE || '13800138000',
    verificationCode: process.env.TEST_CODE || '100000'
  },
  
  // 测试数据
  testOrder: {
    address: '北京市朝阳区三里屯SOHO 5号楼1201室',
    foodType: '吃饭',
    allergy: '海鲜类',
    preference: '香辣',
    deliveryTime: '越快越好',
    budget: '30'
  },
  
  // 移动设备配置
  mobileDevice: {
    // 可选: 'iPhone 14 Pro', 'iPhone 13', 'Samsung Galaxy S21'
    device: process.env.TEST_DEVICE || 'iPhone 14 Pro',
    // 或者自定义视口
    customViewport: process.env.CUSTOM_VIEWPORT ? {
      width: parseInt(process.env.VIEWPORT_WIDTH || '393'),
      height: parseInt(process.env.VIEWPORT_HEIGHT || '852')
    } : null
  },
  
  // Playwright 配置
  playwright: {
    headless: process.env.HEADLESS === 'true' || false,
    slowMo: parseInt(process.env.SLOW_MO || '300'),
    timeout: parseInt(process.env.TIMEOUT || '60000'), // 增加超时时间
    screenshot: {
      enabled: true,
      path: './screenshots'
    }
  },
  
  // 测试选项
  testOptions: {
    skipLogin: false,
    skipOrderCreation: false,
    skipPayment: false,
    skipOrderHistory: false,
    skipWebSocket: false,
    skipPreferences: false
  },
  
  // 报告选项
  report: {
    verbose: process.env.VERBOSE === 'true' || false,
    saveResults: true,
    resultsPath: './test-results'
  }
};