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

		const publicGetter = publidPropertyMap[key]
		if (publicGetter) {
			return publicGetter(instance)
		}
	},
}
