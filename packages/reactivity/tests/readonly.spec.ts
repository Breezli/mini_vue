import { isReadonly, readonly, isProxy } from '../reactive'

describe('readonly', () => {
	it('readonly', () => {
		const original = { foo: 1, bar: { baz: 2 } }
		const wrapped = readonly(original)
		expect(wrapped).not.toBe(original) //返回一个新对象，而非返回原对象
		expect(wrapped.foo).toBe(1)

		expect(isReadonly(wrapped)).toBe(true) //判断是否是只读对象
		expect(isReadonly(original)).toBe(false) //判断是否是只读对象
		expect(isReadonly(original.bar)).toBe(false) //判断是否是只读对象
		expect(isReadonly(wrapped.bar)).toBe(true) //判断是否是只读对象

		expect(isProxy(wrapped)).toBe(true) //判断是否是代理对象
	})

	it('warning when call set', () => {
		console.warn = jest.fn()
		const user = readonly({
			age: 10,
		})
		user.age = 11
		expect(console.warn).toBeCalled() //调用了console.warn
	})
})
