import { track, trigger } from './effect'
import { ReactiveFlags } from './reactive'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)

function createGetter(isReadonly = false) {
	return function get(target, key) {

		if (key === ReactiveFlags.IS_REACTIVE) {//判断是否是响应式对象
			return !isReadonly
		}else if (key === ReactiveFlags.IS_READONLY) {//判断是否是只读对象
			return isReadonly
		}

		const res = Reflect.get(target, key)
		if (!isReadonly) {
			track(target, key)
		}
		return res
	}
}

function createSetter() {
	return function set(target, key, value) {
		const res = Reflect.set(target, key, value)
		trigger(target, key)
		return res
	}
}

export const reactiveHandlers = {
	get: get,
	set: set,
}

export const readonlyHandlers = {
	get: readonlyGet,
	set(target, key, value) {
		console.warn(`key: ${key} set 失败，因为 target 是 readonly 的`, target)
		return true
	},
}
