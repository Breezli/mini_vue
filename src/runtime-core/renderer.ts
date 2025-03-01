import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
	// 调用patch函数
	patch(vnode, container)
}

function patch(vnode: any, container: any) {
	console.log(vnode)
	console.log(vnode.type) // 打印render&setup
	console.log(container) // 打印<div id="app"></div>
	if (typeof vnode.type === 'string') {
		// 处理元素
		processElement(vnode, container)
	} else if (typeof vnode.type === 'object') {
		// 处理组件
		processComponent(vnode, container)
	}
}

function processElement(vnode: any, container: any) {
	mountElement(vnode, container)
}

function processComponent(vnode: any, container: any) {
	mountComponent(vnode, container)
}

function mountComponent(vnode: any, container: any) {
	const instance = createComponentInstance(vnode) // 创建组件实例
	console.log('instance:', instance)

	setupComponent(instance) // 处理组件
	setupRenderEffect(instance, vnode, container) // 处理组件渲染
}

function mountElement(vnode: any, container: any) {
	const el = document.createElement(vnode.type) // 创建真实dom

	const { children, props } = vnode

	if (typeof children === 'string') {
		el.textContent = children // 文本节点
	} else if (Array.isArray(children)) {
		mountChildren(vnode, container) // 处理children
	}

	if (props) {
		for (const key in props) {
			const val = props[key] // 拿到属性值
			el.setAttribute(key, val) // 给真实dom设置属性
		}
	}

	container.append(el) // 挂载到容器中
}

function mountChildren(vnode: any, container: any) {
	vnode.children.forEach((v: any) => {
		patch(v, container) // 递归处理children
	})
}

export function setupRenderEffect(instance: any, vnode: any, container: any) {
	const { proxy } = instance
	console.log('proxy:', proxy)

	const subTree = instance.render.call(proxy)

	console.log('subTree:', subTree)
    console.log('container:', container)

	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container)

	vnode.el = subTree.el
}
