import { createComponentInstance, setupComponent } from "./component"

export function render(vnode: any, container: any) {
	// 调用patch函数
	patch(vnode, container)
}

function patch(vnode: any, container: any) {
	if (vnode.shapeFlag === 1) {
		// 处理element
		processElement(vnode, container)	
	}else if (vnode.shapeFlag === 8) {
		// 处理component
		processComponent(vnode, container)
	}
}

function processElement(vnode: any, container: any) {
	mountElement(vnode, container)	
}

function mountElement(vnode: any, container: any) {
    // 创建组件实例对象
	const instance = createComponentInstance(vnode)

	// 处理组件的setup
	setupComponent(instance)

	// 处理组件的render
	setupRenderEffect(instance, vnode, container)
}

function setupRenderEffect(instance: any, vnode: any, container: any) {
	const { proxy } = instance
	const subTree = instance.render.call(proxy)

	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container)

	vnode.el = subTree.el
}