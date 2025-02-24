import { reactive, isReactive, isProxy } from '../reactive'

describe('reactive', () => {
	it('reactive', () => {
		const original = { age: 1 }
		const observed = reactive(original)
		expect(observed).not.toBe(original)
		expect(observed.age).toBe(1)

		//判断是否是响应式对象
		expect(isReactive(observed)).toBe(true)
		expect(isReactive(original)).toBe(false)

		//判断是否是代理对象
		expect(isProxy(observed)).toBe(true)
	})

	it('嵌套响应式对象转换', () => {
		const original = {
			nested: {
				foo: 1,
			},
			array: [{ bar: 2 }],
		}
		const observed = reactive(original)
		expect(isReactive(observed.nested)).toBe(true)
		expect(isReactive(observed.array)).toBe(true)
		expect(isReactive(observed.array[0])).toBe(true)
	})
})
