import { extend } from '../shared'

let activeEffect //当前激活的effect
let shouldTrack //是否应该收集依赖

export class ReactiveEffect {
	private _fn: any
	public deps = [] //存储依赖
	active = true
	onStop?: () => void
	public scheduler?: Function | undefined
	constructor(fn, scheduler?: Function) {
		this._fn = fn
		this.scheduler = scheduler
	}
	run() {
		if (!this.active) {
			//stop状态直接返回fn
			return this._fn()
		}

		shouldTrack = true
		activeEffect = this

		const res = this._fn()

		shouldTrack = false

		return res
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
	effect.deps.length = 0
}

export function isTracking() {
	return shouldTrack && activeEffect !== undefined
}

const targetMap = new Map() //存储依赖关系
export function track(target, key) {
	if (!isTracking()) {
		return
	}

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

	trackEffects(dep)
}

export function trackEffects(dep) {
	if (dep.has(activeEffect)) {
		return
	}
	dep.add(activeEffect)
	activeEffect.deps.push(dep)
}

export function trigger(target, key) {
	let depsMap = targetMap.get(target)
	// if (!depsMap) {
	// 	return
	// }

	let dep = depsMap.get(key)
	// if (!dep) {
	// 	return
	// }

	triggerEffects(dep)
}

export function triggerEffects(dep) { 
	dep.forEach((effect) => {
		if (effect.scheduler) {
			effect.scheduler()
			return
		} else {
			effect.run()
		}
	})
}

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
