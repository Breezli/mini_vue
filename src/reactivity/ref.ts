import { hasChange, isObject } from '../shared'
import { isTracking, trackEffects, triggerEffects } from './effect'
import { reactive } from './reactive'

class RefImpl {
	private _value: any //值
	public dep //依赖就是唯一的value
	private _rawValue: any //原始值
	public __v_isRef = true //标识是否是ref
	constructor(value) {
		this._rawValue = value
		this._value = convert(value) //如果是对象，就递归
		this.dep = new Set() //存储依赖
	}

	get value() {
		trackRefValue(this) //收集依赖
		return this._value //获取value
	}

	set value(newValue) {
		if (hasChange(newValue, this._rawValue)) {
			//判断是否有变化
			this._rawValue = newValue
			this._value = convert(newValue) //如果是对象，就递归
			triggerEffects(this.dep) //触发依赖
		}
	}
}

function convert(value) {
	return isObject(value) ? reactive(value) : value
}

function trackRefValue(ref) {
	if (isTracking()) {
		trackEffects(ref.dep)
	}
}

export function ref(value) {
	return new RefImpl(value)
}

export function isRef(ref) {
	return !!ref.__v_isRef //转换为布尔值
}

export function unRef(ref) {
	return isRef(ref) ? ref.value : ref //如果是ref，就返回value，否则返回原对象
}

export function proxyRefs(objectWithRefs) {
	return new Proxy(objectWithRefs, {
		get(target, key) {
			return unRef(Reflect.get(target, key)) //如果是ref，就返回value，否则返回原对象
		},
		set(target, key, value) {
			if (isRef(target[key]) && !isRef(value)) {
				return (target[key].value = value) //如果是ref，就返回value，否则返回原对象
			} else {
				return Reflect.set(target, key, value) //如果是ref，就返回value，否则返回原对象
			}
		},
	})
}
