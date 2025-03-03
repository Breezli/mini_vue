export function initProps(instance: any, rawProps: any) {
	// const props: any = {}
	// const attrs: any = {}

	// for (const key in rawProps) {
	// 	const val = rawProps[key]
	// 	if (key === 'class') {
	// 		props[key] = val
	// 	} else if (key === 'style') {
	// 		props[key] = val
	// 	}
	// }
    instance.props = rawProps || {}
}
