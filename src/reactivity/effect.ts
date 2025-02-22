import { extend } from '../shared'

class ReactiveEffect {
	private _fn: any
	public deps = []
	active = true
	onStop?: () => void
	constructor(fn, public scheduler?) {
		this._fn = fn
	}
	run() {
		activeEffect = this
		return this._fn()
	}
	stop() {
		if (this.active) {
			cleanupEffect(this)
			if (this.onStop) {
				this.onStop()
			}
			this.active = false
		}
	}
}

function cleanupEffect(effect) {
	effect.deps.forEach((dep: any) => {
		dep.delete(effect)
	})
}

const targetMap = new Map() //存储依赖关系
export function track(target, key) {
	let depsMap = targetMap.get(target)
	if (!depsMap) {
		depsMap = new Map()
		targetMap.set(target, depsMap)
	}

	let dep = depsMap.get(key)
	if (!dep) {
		dep = new Set()
		depsMap.set(key, dep)
	}

	dep.add(activeEffect)
	activeEffect.deps.push(dep)
}

export function trigger(target, key) {
	let depsMap = targetMap.get(target)
	if (!depsMap) {
		return
	}

	let dep = depsMap.get(key)
	if (!dep) {
		return
	}

	dep.forEach((effect) => {
		if (effect.scheduler) {
			effect.scheduler()
			return
		} else {
			effect.run()
		}
		effect.run()
	})
}

let activeEffect
export function effect(fn, options: any = {}) {
	const _effect = new ReactiveEffect(fn, options.scheduler)
	extend(_effect, options)

	_effect.run() //先执行一次

	const runner: any = _effect.run.bind(_effect) //定义runner函数并绑定this
	runner.effect = _effect //将effect挂载到runner上

	return runner
}

export function stop(runner) {
	runner.effect.stop()
}
