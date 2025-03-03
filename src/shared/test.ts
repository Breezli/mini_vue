const ShapeFlags = {
	ELEMENT: 0,
	STATEFUL_COMPONENT: 0,
	text_children: 0,
	array_children: 0,
}

// vnode -> stateful_component
// 1.可以设置 修改
// ShapeFlags.stateful_component = 1;
// ShapeFlags.array children = 1;

// 2.查找
// if(shapeFlags.element)
// if(shapeFlags.stateful_component)

// 不够高效 -> 位运算的方式来
// 0000
// 0001 -> element
// 0010 -> stateful
// 0100 -> text children
// 1000 -> array_children

// 1010

// | (两位都为 0, 才为0)
// & (两位都为 1, 才为1)

// 修改 |
// 0000
// 0001
// ————
// 0001

// 查找 &
// 0000
// 0001
// ————
// 0000