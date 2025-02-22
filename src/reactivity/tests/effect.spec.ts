import { effect } from '../effect'
import { reactive } from '../reactive'
import { stop } from '../effect'

describe('effect函数实现', () => {
	it.skip('能够收集依赖&响应式属性更新时自动触发副作用函数', () => {
		const user = reactive({
			// 响应式对象
			age: 10,
		})

		let nextAge
		effect(() => {
			//收集依赖 接收fn 触发get操作
			nextAge = user.age + 1
		})

		expect(nextAge).toBe(11)

		// update 触发set操作
		user.age++
		expect(nextAge).toBe(12)
	})

	it('调用新实例可以触发effect', () => {
		let foo = 10
		const runner = effect(() => {
			foo++
			return foo
		})

		expect(foo).toBe(11) //创建effect - foo++
		const r = runner() //调用runner - foo++
		expect(foo).toBe(12)
		expect(r).toBe(foo) //调用runner - foo++
	})

	it('scheduler的执行逻辑', () => {
		// 1. 通过 effect 的第二个参数给定一个 scheduler 的 fn
		// 2. effect 第一次执行的时候 还会执行 fn
		// 3. 当 响应式对象 set update 不会执行 fn 而是执行 scheduler
		// 4. 如果说当执行 runner 的时候 会再次执行 fn
		let dummy
		let run: any
		const scheduler = jest.fn(() => {
			run = runner
		})
		const obj = reactive({ foo: 1 })
		const runner = effect(
			() => {
				dummy = obj.foo
			},
			{ scheduler }
		)

		expect(scheduler).not.toHaveBeenCalled() //scheduler不会被调用
		expect(dummy).toBe(1)

		//当响应式对象set时调用scheduler,但不会执行fn
		obj.foo++
		expect(scheduler).toHaveBeenCalledTimes(1)
		expect(dummy).toBe(1)

		//调用runner时执行fn
		run()
		expect(dummy).toBe(2)
	})

	it('stop的执行逻辑', () => {
		let dummy
		const obj = reactive({ prop: 1 })
		const runner = effect(() => {
			dummy = obj.prop
		})
		obj.prop = 2
		expect(dummy).toBe(2)

		stop(runner) //停止执行runner

		obj.prop = 3
		expect(dummy).toBe(2)

		runner() //调用runner继续执行
		expect(dummy).toBe(3)
	})

	it('onStop的执行逻辑', () => {
		const obj = reactive({
			foo: 1,
		})
		const onStop = jest.fn()
		let dummy
		const runner = effect(
			() => {
				dummy = obj.foo
			},
			{
				onStop,
			}
		)
		stop(runner)
		expect(onStop).toBeCalledTimes(1)
	})
})
