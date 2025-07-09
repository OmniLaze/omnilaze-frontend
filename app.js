// AI外卖助手小程序入口文件
App({
  onLaunch() {
    // 小程序初始化完成时触发
    console.log('AI外卖助手小程序启动');
    
    // 检查更新
    this.checkForUpdate();
    
    // 获取系统信息
    this.getSystemInfo();
    
    // 初始化用户数据
    this.initUserData();
  },

  onShow() {
    // 小程序启动或从后台进入前台时触发
    console.log('AI外卖助手进入前台');
  },

  onHide() {
    // 小程序从前台进入后台时触发
    console.log('AI外卖助手进入后台');
  },

  onError(msg) {
    // 小程序发生脚本错误或API调用报错时触发
    console.error('小程序错误:', msg);
  },

  // 检查小程序更新
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager();
      
      updateManager.onCheckForUpdate((res) => {
        if (res.hasUpdate) {
          console.log('发现新版本，准备更新');
        }
      });

      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate();
            }
          }
        });
      });

      updateManager.onUpdateFailed(() => {
        console.error('新版本下载失败');
      });
    }
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res;
        console.log('系统信息:', res);
      },
      fail: (err) => {
        console.error('获取系统信息失败:', err);
      }
    });
  },

  // 初始化用户数据
  initUserData() {
    // 从本地存储获取用户偏好设置
    const userPreferences = wx.getStorageSync('userPreferences');
    if (userPreferences) {
      this.globalData.userPreferences = userPreferences;
    }
    
    // 从本地存储获取历史订单
    const orderHistory = wx.getStorageSync('orderHistory');
    if (orderHistory) {
      this.globalData.orderHistory = orderHistory;
    }
  },

  // 保存用户偏好设置
  saveUserPreferences(preferences) {
    this.globalData.userPreferences = { ...this.globalData.userPreferences, ...preferences };
    wx.setStorageSync('userPreferences', this.globalData.userPreferences);
  },

  // 添加订单到历史记录
  addOrderToHistory(orderData) {
    if (!this.globalData.orderHistory) {
      this.globalData.orderHistory = [];
    }
    
    this.globalData.orderHistory.unshift({
      ...orderData,
      id: Date.now(),
      timestamp: new Date().toISOString()
    });
    
    // 只保留最近20条订单记录
    if (this.globalData.orderHistory.length > 20) {
      this.globalData.orderHistory = this.globalData.orderHistory.slice(0, 20);
    }
    
    wx.setStorageSync('orderHistory', this.globalData.orderHistory);
  },

  // 全局数据
  globalData: {
    // 系统信息
    systemInfo: null,
    // 用户偏好设置
    userPreferences: {
      defaultBudget: '',
      favoriteRestaurants: [],
      allergens: [],
      deliveryAddresses: []
    },
    // 订单历史
    orderHistory: [],
    // API基础URL
    apiBaseUrl: 'https://your-api-domain.com',
    // 当前用户信息
    userInfo: null,
    // 是否已授权
    hasUserInfo: false
  }
});