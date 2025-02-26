Page({
    data: {
        dayItems: ['今天', '明天', '后天'],
        mealItems: ['早餐', '午餐', '晚餐'],
        aiItems: ['chatgpt', 'deepseek', '通义千问'],

        defaultDayIndex: 1,  // 明天
        defaultMealIndex: 1, // 午餐
        defaultAiIndex: 1,   // chatgpt o1

        selectedDay: '明天',
        selectedMeal: '午餐',
        selectedAI: 'deepseek'
    },

    onDayPickerChange(e) {
        const index = e.detail.index;
        this.setData({
            selectedDay: this.data.dayItems[index]
        });
    },

    onMealPickerChange(e) {
        const index = e.detail.index;
        this.setData({
            selectedMeal: this.data.mealItems[index]
        });
    },

    onAiPickerChange(e) {
        const index = e.detail.index;
        this.setData({
            selectedAI: this.data.aiItems[index]
        });
    },

    onDecideTap() {
        wx.showToast({
            title: `已选择: ${this.data.selectedDay}${this.data.selectedMeal}，交给${this.data.selectedAI}吧！`,
            icon: 'none'
        });
    }
});
