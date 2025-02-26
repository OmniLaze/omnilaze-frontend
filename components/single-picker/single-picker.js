Component({
    properties: {
        items: {
            type: Array,
            value: []
        },
        defaultIndex: {
            type: Number,
            value: 0
        },
        // 新增这些属性，用于控制高度、行高、字号等
        width: {
            type: String,
            value: '40rpx'
        },
        height: {
            type: String,
            value: '40rpx'
        },
        lineHeight: {
            type: String,
            value: '40rpx'
        },
        fontSize: {
            type: String,
            value: '40rpx'
        }
    },
    data: {
        value: [] // 将在 attached 钩子中初始化为 [defaultIndex]
    },
    lifetimes: {
        attached() {
            this.setData({
                value: [this.properties.defaultIndex]
            });
        }
    },
    methods: {
        onPickerChange(e) {
            const newValue = e.detail.value[0];
            this.setData({
                value: [newValue]
            });
            this.triggerEvent('pickerChange', { index: newValue });
        }
    }
});
