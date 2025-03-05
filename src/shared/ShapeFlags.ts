export const enum ShapeFlags {
	ELEMENT = 1, // 00001
	STATEFUL_COMPONENT = 1 << 2, // 00010
	TEXT_CHILDREN = 1 << 3, // 00100
	ARRAY_CHILDREN = 1 << 4, // 01000
	SLOTS_CHILDREN = 1 << 5, // 10000
}
