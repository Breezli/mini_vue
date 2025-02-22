import { reactive } from '../reactive'

describe('reactive', () => {
    it('reactive', () => {
        const original = { age: 1 }
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(observed.age).toBe(1)
    })
})