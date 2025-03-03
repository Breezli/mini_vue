import { ShapeFlags } from '../shared/ShapeFlags'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
	// 调用patch函数
	patch(vnode, container)
}

function patch(vnode: any, container: any) {
	console.log(vnode)
	console.log(vnode.type) // 打印render&setup
	console.log(container) // 打印<div id="app"></div>
	const { shapeFlag } = vnode
	if (shapeFlag & ShapeFlags.ELEMENT) {
		// 处理元素
		processElement(vnode, container)
	} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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
	const el = document.createElement(vnode.type) as HTMLElement // 创建真实dom

	const { children, props, shapeFlag } = vnode

	if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
		el.textContent = children // 文本节点
	} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
		mountChildren(vnode, el) // 处理children
	}

	if (props) {
		for (const key in props) {
			const val = props[key] // 拿到属性值
			const isOn = (key: string) => /^on[A-Z]/.test(key) // 判断是否是事件
			if (isOn(key)) {
				const event = key.slice(2).toLowerCase() // 拿到事件名
				el.addEventListener(event, val) // 给真实dom绑定事件
			} else {
				el.setAttribute(key, val) // 给真实dom绑定属性
			}
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
	const subTree = instance.render.call(proxy)

	console.log('subTree:', subTree)
	console.log('container:', container)

	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container)

	vnode.el = subTree.el
}
