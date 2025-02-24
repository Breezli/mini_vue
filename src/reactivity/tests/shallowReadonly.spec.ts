import { isReadonly, shallowReadonly } from '../reactive'

describe('shallowReadonly', () => {
    it('shallowReadonly', () => {
        const props = shallowReadonly({ n: { foo: 1 } })
        expect(isReadonly(props)).toBe(true)//表层只读
        expect(isReadonly(props.n)).toBe(false)//内部正常
    })
})