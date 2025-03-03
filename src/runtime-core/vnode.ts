import { ShapeFlags } from '../shared/ShapeFlags'

export function createVNode(type: any, props?: any, children?: any) {
	const vnode = {
		type, // 类型
		props, // 属性
		children, // 孩子
		el: null, // 对应的真实dom
		component: null, // 组件实例
		key: props?.key, // 唯一标识
		shapeFlag: getShapeFlag(type), // 类型标识
	}

	if (typeof children === 'string') {
		vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN // 0001 | 0100 = 0101
	} else if (Array.isArray(children)) {
		vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN // 0001 | 1000 = 1001
	}

	return vnode
}

function getShapeFlag(type: any) {
	return typeof type === 'string'
		? ShapeFlags.ELEMENT
		: ShapeFlags.STATEFUL_COMPONENT
}
