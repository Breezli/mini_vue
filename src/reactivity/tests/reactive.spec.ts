import { reactive } from '../reactive'
import { isReactive } from '../reactive'

describe('reactive', () => {
    it('reactive', () => {
        const original = { age: 1 }
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(observed.age).toBe(1)

        //判断是否是响应式对象
        expect(isReactive(observed)).toBe(true)
        expect(isReactive(original)).toBe(false)
    })
})