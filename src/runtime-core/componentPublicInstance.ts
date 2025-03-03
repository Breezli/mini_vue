const publidPropertyMap = {
	$el: (i) => i.vnode.el,
	// $slots: (i) => i.slots,
	// $props: (i) => i.props,
}

export const PublicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		const { setupState, props } = instance
		if (key in setupState) {
			return setupState[key]
		}

		const hasOwn = (val: object, key: string) =>
			Object.prototype.hasOwnProperty.call(val, key)

		if (hasOwn(setupState, key)) {
			return setupState[key]
		} else if (props in instance) {
			return props[key]
		}

		const publicGetter = publidPropertyMap[key]
		if (publicGetter) {
			return publicGetter(instance)
		}
	},
}
