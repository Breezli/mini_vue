import { render } from './renderer'
import { createVNode } from './vnode'

export function createApp(rootComponent: any) {
	console.log('rootComponent:', rootComponent)
	// 传入根组件
	return {
		mount(rootContainer: any) {
			console.log('rootContainer:', rootContainer)
			// 挂载回根容器
			// 先把根组件转换成虚拟节点vnode
			// 之后所有的操作都会基于vnode做处理
			const vnode = createVNode(rootComponent)
			console.log('vnode:', vnode)

			render(vnode, rootContainer)
		},
	}
}
