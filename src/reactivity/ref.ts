import { trackEffects } from './effect'

class RefImpl {
	private _value: any //值
	public dep //依赖就是唯一的value
	constructor(value) {
		//构造函数
		this._value = value //存储值
		this.dep = new Set() //存储依赖
	}

	get value() {
		trackEffects(this.dep) //收集依赖

		return this._value //获取value
	}

	set value(newValue) {}
}

export function ref(value) {
	return new RefImpl(value)
}
