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
        value: 0
    },
    methods: {
        onPickerChange(e) {
            const { value } = e.detail;
            this.setData({ value });
            // 通知父级
            this.triggerEvent('pickerChange', value);
        }
    }
});
