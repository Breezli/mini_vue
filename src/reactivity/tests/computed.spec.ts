import { computed } from '../computed'
import { reactive } from '../reactive'
describe('computed', () => {
	it('computed', () => {
		const user = reactive({
			age: 1,
		})
		const age = computed(() => {
			return user.age
		})
		expect(age.value).toBe(1)
	})

	it('should compute lazily', () => {
		const value = reactive({
			foo: 1,
		})
		const getter = jest.fn(() => {
			return value.foo
		})
		const cValue = computed(getter)
		expect(getter).not.toHaveBeenCalled()
		expect(cValue.value).toBe(1)
		expect(getter).toHaveBeenCalledTimes(1)
		// 再次访问，不应该再调用
		cValue.value
		expect(getter).toHaveBeenCalledTimes(1)
		// 不应该再调用
		value.foo = 2
		expect(getter).toHaveBeenCalledTimes(1)
		// 触发getter
		expect(cValue.value).toBe(2)
		expect(getter).toHaveBeenCalledTimes(2)
		// 不应该再调用
		cValue.value
		expect(getter).toHaveBeenCalledTimes(2)		
	})
})
