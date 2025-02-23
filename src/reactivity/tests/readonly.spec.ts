import { isReadonly, readonly } from '../reactive'

describe('readonly', () => {
	it('readonly', () => {
		const original = { foo: 1 }
		const wrapped = readonly(original)
		expect(wrapped).not.toBe(original) //返回一个新对象，而非返回原对象
		expect(wrapped.foo).toBe(1)

		expect(isReadonly(wrapped)).toBe(true)//判断是否是只读对象
	})

	it('warning when call set', () => {
		console.warn = jest.fn()
		const user = readonly({
			age: 10,
		})
		user.age = 11
		expect(console.warn).toBeCalled()//调用了console.warn
	})
})
