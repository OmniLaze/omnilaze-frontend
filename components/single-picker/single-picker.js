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
        // 新增 width 属性
        width: {
            type: String,
            value: "30px"
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
