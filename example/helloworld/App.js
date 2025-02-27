export const App = {
    render() {
        // UI逻辑
        return h(
            // Vue 中的创建虚拟 DOM 的辅助函数,用于创建虚拟 DOM 节点,接收三个参数：
            'div', // 要创建的 HTML 标签名或组件选项对象.
            {}, // 标签属性,可以是一个对象或数组.
            'hi, ' + this.msg // 子节点,可以是字符串、数字、数组或其他虚拟 DOM 节点.
        )
    },
    setup() {
        // 组合式 API 的入口点,用于组合组件的逻辑，例如响应式数据、生命周期钩子、计算属性等
        return {
            msg: 'mini-vue',
        }
    },
}