import { effect } from '../effect'
import { isRef, proxyRefs, ref, unRef } from '../ref'

describe('ref', () => {
	it('value', () => {
		const a = ref(1)
		expect(a.value).toBe(1)
	})

	it('响应基础', () => {
		const a = ref(1)
		let dummy
		let calls = 0
		effect(() => {
			calls++
			dummy = a.value
		})
		expect(calls).toBe(1) //effect执行了一次
		expect(dummy).toBe(1)
		a.value = 2
		expect(calls).toBe(2)
		expect(dummy).toBe(2)
		// 值相同不会触发
		a.value = 2
		expect(calls).toBe(2)
		expect(dummy).toBe(2)
	})

	it('嵌套响应', () => {
		const a = ref({
			count: 1,
		})
		let dummy
		effect(() => {
			dummy = a.value.count
		})
		expect(dummy).toBe(1)
		a.value.count = 2
		expect(dummy).toBe(2)
	})

	it('isRef', () => {
		const a = ref(1)
		const user = {
			age: a,
		}
		expect(isRef(a)).toBe(true)
		expect(isRef(1)).toBe(false)
		expect(isRef(user)).toBe(false)
	})

	it('unRef', () => {
		//
		const a = ref(1)
		expect(unRef(a)).toBe(1)
		expect(unRef(1)).toBe(1)
	})

	it('proxyRefs', () => {
		const user = {
			age: ref(10),
			name: 'zf',
		}
		const proxyUser = proxyRefs(user)
		expect(user.age.value).toBe(10)
		expect(proxyUser.age).toBe(10)//可以省略.value
		expect(proxyUser.name).toBe('zf')//可以省略.value

		proxyUser.age = 20
		expect(proxyUser.age).toBe(20)
		expect(user.age.value).toBe(20)

		proxyUser.age = ref(10)
		expect(proxyUser.age).toBe(10)
		expect(user.age.value).toBe(10)
	})
})
