import { isObject } from '../shared/index'
import {
	reactiveHandlers,
	readonlyHandlers,
	shallowReadonlyHandlers,
} from './baseHanders'

export const enum ReactiveFlags {
	IS_REACTIVE = '__v_isReactive',
	IS_READONLY = '__v_isReadonly',
}

function createActiveEffect(raw: any, baseHanders) {
	// 1.判断是否是对象
	if (!isObject(raw)) {
		console.warn(`target ${raw} 必须是一个对象`)
		return raw
	}
	
	// 2.如果已经是代理对象，不需要再次代理
	if (raw[ReactiveFlags.IS_REACTIVE] || raw[ReactiveFlags.IS_READONLY]) {
		return raw		
	}

	// 3.创建代理对象
	return new Proxy(raw, baseHanders)
}

export function reactive(raw) {
	return createActiveEffect(raw, reactiveHandlers)
}

export function readonly(raw) {
	return createActiveEffect(raw, readonlyHandlers)
}
export function shallowReadonly(raw) {
	return createActiveEffect(raw, shallowReadonlyHandlers)
}

export function isReactive(value) {
	//判断是否是响应式对象
	return !!value[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(value) {
	//判断是否是只读对象
	return !!value[ReactiveFlags.IS_READONLY]
}

export function isProxy(value) {
	//判断是否是代理对象
	return isReactive(value) || isReadonly(value)	
}