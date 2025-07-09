// 透明管家式AI点餐助手 - 革命性体验设计
Page({
  data: {
    // 通知信息流
    notifications: [],
    // 主输入框状态
    showMainInput: true,
    mainInputValue: '',
    mainInputFocus: false,
    // 动态占位符
    dynamicPlaceholder: '想吃好消化的',
    placeholderIndex: 0,
    // 智能预设
    autoDetectedTime: '',
    autoBudget: 20,
    // AI工作状态
    showWorkingIndicator: false,
    workingText: '正在为您挑选外卖...',
    // 快速提示
    showQuickHints: false,
    // 效果状态
    showRippleEffect: false,
    // 自动确认倒计时
    countdownActive: false,
    countdownSeconds: 5,
    countdownTimer: null,
    // 用户数据 (自动收集)
    userData: {
      mealTime: '',
      budget: 20,
      preferences: '',
      location: ''
    },
    // 系统状态
    isProcessing: false,
    hasResult: false,
    // 通知ID计数器
    notificationId: 0,
    // 滚动相关
    scrollTop: 0,
    scrollIntoView: ''
  },

  onLoad() {
    // 初始化智能系统
    this.initIntelligentSystem();
    // 启动动态占位符
    this.startDynamicPlaceholder();
    // 自动检测用户环境
    this.autoDetectUserContext();
  },

  onUnload() {
    // 清理定时器
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }
    if (this.placeholderTimer) {
      clearInterval(this.placeholderTimer);
    }
  },

  // 初始化智能系统
  initIntelligentSystem() {
    console.log('透明管家系统启动...');
  },

  // 启动动态占位符循环
  startDynamicPlaceholder() {
    const placeholders = [
      '想吃好消化的',
      '今天晚上我要吃20元的炸鸡',
      '今天中午点一个小于15元的快餐'
    ];

    this.placeholderTimer = setInterval(() => {
      const currentIndex = this.data.placeholderIndex;
      const nextIndex = (currentIndex + 1) % placeholders.length;

      this.setData({
        dynamicPlaceholder: placeholders[nextIndex],
        placeholderIndex: nextIndex
      });
    }, 4000);
  },

  // 自动检测用户环境
  autoDetectUserContext() {
    const now = new Date();
    const hour = now.getHours();

    let detectedTime = '';
    let suggestedBudget = 20;

    if (hour >= 11 && hour <= 14) {
      detectedTime = '默认：立即下单';
      suggestedBudget = 20;
    } else if (hour >= 17 && hour <= 21) {
      detectedTime = '默认：立即下单';
      suggestedBudget = 20;
    } else if (hour >= 21 || hour <= 2) {
      detectedTime = '默认：立即下单';
      suggestedBudget = 20;
    } else {
      detectedTime = '默认：立即下单';
    }

    this.setData({
      autoDetectedTime: detectedTime,
      autoBudget: suggestedBudget,
      ['userData.mealTime']: detectedTime,
      ['userData.budget']: suggestedBudget
    });
  },

  // 显示工作状态
  showWorkingStatus(text = '正在为您挑选外卖...') {
    this.setData({
      showWorkingIndicator: true,
      workingText: text,
      isProcessing: true
    });
    this.scrollToBottom();
  },

  // 隐藏工作状态
  hideWorkingStatus() {
    this.setData({
      showWorkingIndicator: false,
      isProcessing: false
    });
  },

  // 添加通知信息
  addNotification(content, type = 'notification', options = {}) {
    const notificationId = this.data.notificationId + 1;
    const notification = {
      id: notificationId,
      type: type,
      content: content,
      timestamp: Date.now(),
      ...options
    };

    this.setData({
      notifications: [...this.data.notifications, notification],
      notificationId: notificationId,
      scrollIntoView: `notification-${notificationId}`
    });

    this.scrollToBottom();
  },

  // 添加用户输入回显
  addUserEcho(content) {
    const notificationId = this.data.notificationId + 1;
    const notification = {
      id: notificationId,
      type: 'user-echo',
      content: content,
      timestamp: Date.now()
    };

    this.setData({
      notifications: [...this.data.notifications, notification],
      notificationId: notificationId,
      scrollIntoView: `notification-${notificationId}`
    });

    this.scrollToBottom();
  },

  // 添加结果通知
  addResultNotification(dishData) {
    const notificationId = this.data.notificationId + 1;
    const notification = {
      id: notificationId,
      type: 'result-notification',
      dishName: dishData.name,
      restaurant: dishData.restaurant,
      price: dishData.price,
      deliveryTime: dishData.deliveryTime,
      showCountdown: true,
      countdown: 5,
      showDetails: false,
      dishData: dishData,
      timestamp: Date.now()
    };

    this.setData({
      notifications: [...this.data.notifications, notification],
      notificationId: notificationId,
      scrollIntoView: `notification-${notificationId}`,
      hasResult: true
    });

    this.scrollToBottom();

    // 启动自动倒计时
    this.startAutoCountdown(notificationId, dishData);
  },

  // 启动自动倒计时
  startAutoCountdown(notificationId, dishData) {
    let seconds = 5;

    this.setData({
      countdownActive: true,
      countdownSeconds: seconds
    });

    const timer = setInterval(() => {
      seconds--;

      // 更新通知中的倒计时
      const notifications = this.data.notifications.map(notification => {
        if (notification.id === notificationId) {
          return {
            ...notification,
            countdown: seconds
          };
        }
        return notification;
      });

      this.setData({
        notifications: notifications,
        countdownSeconds: seconds
      });

      if (seconds <= 0) {
        clearInterval(timer);
        this.autoConfirmOrder(dishData);
      }
    }, 1000);

    this.setData({
      countdownTimer: timer
    });
  },

  // 自动确认订单
  autoConfirmOrder(dishData) {
    this.setData({
      countdownActive: false
    });

    // 显示确认通知
    this.addNotification(`✨ 订单已自动确认\n${dishData.name} 正在路上`, 'notification');

    // 隐藏输入框
    this.setData({
      showMainInput: false
    });

    // 调用订单API
    this.submitOrderToBackend(dishData);
  },

  // 主输入框事件
  onMainInput(e) {
    this.setData({
      mainInputValue: e.detail.value
    });
  },

  onMainInputFocus() {
    console.log('输入框获得焦点');
    this.setData({
      mainInputFocus: true
    });
  },

  onMainInputBlur() {
    console.log('输入框失去焦点');
    this.setData({
      mainInputFocus: false
    });
  },

  onMainInputenable() {
    console.log('输入框启用状态变化');
  },

  // 手动触发输入框焦点
  focusInput() {
    console.log('点击输入区域，尝试获取焦点');
    this.setData({
      mainInputFocus: true
    });
  },

  // 提交主输入
  submitMainInput() {
    const input = this.data.mainInputValue.trim();
    if (!input) return;

    // 显示用户输入回显
    this.addUserEcho(input);

    // 清空输入框
    this.setData({
      mainInputValue: '',
      showMainInput: false
    });

    // 开始智能处理
    this.processUserInput(input);
  },

  // 智能处理用户输入
  processUserInput(input) {
    // 显示工作状态
    this.showWorkingStatus('正在理解您的需求...');

    // 保存用户偏好
    this.setData({
      ['userData.preferences']: input
    });

    // 模拟AI分析延迟
    setTimeout(() => {
      this.setData({
        workingText: '正在匹配最佳外卖...'
      });

      setTimeout(() => {
        this.hideWorkingStatus();
        this.generateFoodRecommendation(input);
      }, 2000);
    }, 1500);
  },

  // 生成外卖推荐
  generateFoodRecommendation(userInput) {
    // 智能分析用户输入
    const analysis = this.analyzeUserPreferences(userInput);

    // 生成推荐结果
    const recommendation = this.generateDishRecommendation(analysis);

    // 显示结果通知
    setTimeout(() => {
      this.addResultNotification(recommendation);
    }, 500);
  },

  // 分析用户偏好
  analyzeUserPreferences(input) {
    const preferences = {
      spicy: 20,
      sweet: 30,
      cuisine: '中式',
      price: this.data.userData.budget
    };

    // 简单关键词匹配
    if (input.includes('辣') || input.includes('麻辣') || input.includes('川菜')) {
      preferences.spicy = 80;
      preferences.cuisine = '川菜';
    }
    if (input.includes('清淡') || input.includes('健康')) {
      preferences.spicy = 10;
      preferences.sweet = 20;
    }
    if (input.includes('甜') || input.includes('糖')) {
      preferences.sweet = 70;
    }
    if (input.includes('便宜') || input.includes('经济')) {
      preferences.price = Math.min(preferences.price, 30);
    }
    if (input.includes('好吃') || input.includes('豪华')) {
      preferences.price = Math.max(preferences.price, 60);
    }

    return preferences;
  },

  generateDishRecommendation(preferences = {}) {
    const budget = preferences.price || this.data.userData.budget || 20;
    const spicyLevel = preferences.spicy || 20;
    const sweetLevel = preferences.sweet || 30;
    const cuisine = preferences.cuisine || '中式';

    // 智能菜品库（实际应该从后端API获取）
    const smartDishes = [
      {
        name: '歌乐山辣子鸡',
        image: '/images/spicy-chicken.jpg',
        price: Math.min(budget, 45),
        rating: 4.8,
        spicyLevel: 85,
        sweetLevel: 25,
        tags: ['川菜', '麻辣', '下饭'],
        description: '重庆经典，麻辣鲜香，味觉的火焰交响曲',
        restaurant: '老川东酒楼',
        deliveryTime: '32分钟',
        orderLink: 'https://example.com/order/1'
      },
      {
        name: '香煎三文鱼',
        image: '/images/salmon.jpg',
        price: Math.min(budget, 52),
        rating: 4.6,
        spicyLevel: 5,
        sweetLevel: 40,
        tags: ['日式', '清香', '健康'],
        description: '新鲜三文鱼，口感纯正，清香淡雅',
        restaurant: '和风料理',
        deliveryTime: '25分钟',
        orderLink: 'https://example.com/order/2'
      },
      {
        name: '糖醋排骨',
        image: '/images/sweet-ribs.jpg',
        price: Math.min(budget, 38),
        rating: 4.7,
        spicyLevel: 10,
        sweetLevel: 75,
        tags: ['家常菜', '甜香', '怀旧'],
        description: '甜而不腻，入口即化，妈妈的拿手好菜',
        restaurant: '家常小厨',
        deliveryTime: '28分钟',
        orderLink: 'https://example.com/order/3'
      }
    ];

    // 智能匹配算法
    let bestMatch = smartDishes[0];
    let bestScore = 0;

    smartDishes.forEach(dish => {
      let score = 0;

      // 价格匹配度 (30%)
      const priceDiff = Math.abs(dish.price - budget);
      score += Math.max(0, 30 - priceDiff * 0.5);

      // 口味匹配度 (70%)
      const spicyMatch = Math.max(0, 35 - Math.abs(dish.spicyLevel - spicyLevel) * 0.5);
      const sweetMatch = Math.max(0, 35 - Math.abs(dish.sweetLevel - sweetLevel) * 0.5);
      score += spicyMatch + sweetMatch;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = dish;
      }
    });

    return bestMatch;
  },

  // 提交订单到后端
  submitOrderToBackend(dishData) {
    const orderData = {
      dishName: dishData.name,
      restaurant: dishData.restaurant,
      price: dishData.price,
      mealTime: this.data.userData.mealTime,
      budget: this.data.userData.budget,
      preferences: this.data.userData.preferences,
      timestamp: Date.now()
    };

    console.log('自动提交订单:', orderData);

    // 模拟 API 调用
    setTimeout(() => {
      this.addNotification('🎉 订单已提交成功\n骑手已接单，请耐心等待', 'notification');
    }, 1000);
  },

  // 滚动到底部
  scrollToBottom() {
    // 添加延迟确保DOM渲染完成
    setTimeout(() => {
      const query = wx.createSelectorQuery();
      query.select('.information-flow').boundingClientRect((rect) => {
        if (rect && rect.height) {
          this.setData({
            scrollTop: rect.height
          });
        }
      });
      query.exec();
    }, 100);
  },

  // 处理订单按钮点击（兼容旧版本）
  proceedToOrder(e) {
    const orderLink = e.currentTarget.dataset.link;
    console.log('用户手动跳转到订单链接:', orderLink);

    // 停止自动倒计时
    if (this.data.countdownTimer) {
      clearInterval(this.data.countdownTimer);
    }

    this.addNotification('🚀 正在为您跳转到订单页面...', 'notification');

    // 在实际应用中，这里应该跳转到外部链接
    wx.showModal({
      title: '订单确认',
      content: '即将跳转到外卖平台完成下单，确定继续吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '正在跳转...',
            icon: 'loading',
            duration: 2000
          });
        }
      }
    });
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '懒得 - 智能点外卖助手',
      path: '/pages/chat/chat',
      imageUrl: '/images/share-cover.jpg'
    };
  }
});
