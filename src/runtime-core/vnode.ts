export function createVNode(type: any, props?: any, children?: any) {
	const vnode = {
		type,// 类型
		props,// 属性
		children,// 孩子
		el: null,// 对应的真实dom
		component: null,// 组件实例
		key: props?.key,// 唯一标识
		// shapeFlag: getShapeFlag(type), // 类型标识
	}
    return vnode
}