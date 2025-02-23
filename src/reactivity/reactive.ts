import { reactiveHandlers, readonlyHandlers } from './baseHanders'

export const enum ReactiveFlags {
	IS_REACTIVE = '__v_isReactive',
	IS_READONLY = '__v_isReadonly',
}

function createActiveEffect(raw: any, baseHanders) {
	return new Proxy(raw, baseHanders)
}

export function reactive(raw) {
	return createActiveEffect(raw, reactiveHandlers)
}

export function readonly(raw) {
	return createActiveEffect(raw, readonlyHandlers)
}

export function isReactive(value) {//判断是否是响应式对象
	return !!value[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(value) {//判断是否是只读对象
	return !!value[ReactiveFlags.IS_READONLY]
}
