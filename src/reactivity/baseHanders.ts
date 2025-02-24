import { track, trigger } from './effect'
import { ReactiveFlags, shallowReadonly } from './reactive'
import { extend, isObject } from '../shared/index'
import { reactive, readonly } from './reactive'

const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)

function createGetter(isReadonly = false, shallow = false) {
	return function get(target, key) {
		if (key === ReactiveFlags.IS_REACTIVE) {
			//判断是否是响应式对象
			return !isReadonly
		} else if (key === ReactiveFlags.IS_READONLY) {
			//判断是否是只读对象
			return isReadonly
		}

		const res = Reflect.get(target, key)

		if (shallow) {
			return res	
		}

		if (isObject(res)) {
			//判断是否是对象
			return isReadonly ? readonly(res) : reactive(res) //返回只读对象或者响应式对象
		}

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

export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
})
