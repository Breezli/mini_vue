import { initProps } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { setupRenderEffect } from './renderer'
import { shallowReadonly } from '../reactivity/reactive'

export function createComponentInstance(vnode: any) {
	const instance = {
		vnode,
		type: vnode.type,
		props: vnode.props,
		slots: vnode.slots,
		proxy: null, // 代理对象
	}
	return instance
}

export function setupComponent(instance: any) {
	// 初始化组件
	initProps(instance, instance.vnode.props)
	// initSlots(instance)

	// 处理组件的setup
	setupStatefulComponent(instance)
}

export function setupStatefulComponent(instance: any) {
	// 先拿到组件
	const Component = instance.type

	// 创建代理对象
	instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

	const { setup } = Component //解构出setup
	console.log('setup:', setup)

	if (setup) {
		// setCurrentInstance(instance)
		const setupResult = setup(shallowReadonly(instance.props))
		console.log('setupResult:', setupResult)
		// setCurrentInstance(null)

		handleSetupResult(instance, setupResult)
	} else {
		finishComponentSetup(instance)
	}
}

function handleSetupResult(instance: any, setupResult: any) {
	if (typeof setupResult === 'object' && setupResult !== null) {
		instance.setupState = setupResult
	}

	finishComponentSetup(instance) // 处理组件的render
}

function finishComponentSetup(instance: any) {
	// 拿到组件
	const Component = instance.type

	if (Component.render) {
		instance.render = Component.render
	} else {
		instance.render = instance.vnode.render
	}
}
