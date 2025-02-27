import { render } from "./renderer"
import { createVNode } from "./vnode"

export function createApp(rootComponent: any) {
	// 传入根组件
	return {
		mount(rootContainer: any) {
			// 挂载回根容器
			// 先把根组件转换成虚拟节点vnode
			// 之后所有的操作都会基于vnode做处理
			const vnode = createVNode(rootComponent)

			render(vnode, rootContainer)
		},
	}
}