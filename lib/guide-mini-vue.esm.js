const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};

const targetMap = new Map(); //存储依赖关系
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    // if (!depsMap) {
    // 	return
    // }
    let dep = depsMap.get(key);
    // if (!dep) {
    // 	return
    // }
    triggerEffects(dep);
}
function triggerEffects(dep) {
    dep.forEach((effect) => {
        if (effect.scheduler) {
            effect.scheduler();
            return;
        }
        else {
            effect.run();
        }
    });
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            //判断是否是响应式对象
            return !isReadonly;
        }
        else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            //判断是否是只读对象
            return isReadonly;
        }
        const res = Reflect.get(target, key);
        if (shallow) {
            return res;
        }
        if (isObject(res)) {
            //判断是否是对象
            return isReadonly ? readonly(res) : reactive(res); //返回只读对象或者响应式对象
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const reactiveHandlers = {
    get: get,
    set: set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key: ${key} set 失败，因为 target 是 readonly 的`, target);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function createActiveEffect(raw, baseHanders) {
    // 1.判断是否是对象
    if (!isObject(raw)) {
        console.warn(`target ${raw} 必须是一个对象`);
        return raw;
    }
    // 2.如果已经是代理对象，不需要再次代理
    if (raw["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */] || raw["__v_isReadonly" /* ReactiveFlags.IS_READONLY */]) {
        return raw;
    }
    // 3.创建代理对象
    return new Proxy(raw, baseHanders);
}
function reactive(raw) {
    return createActiveEffect(raw, reactiveHandlers);
}
function readonly(raw) {
    return createActiveEffect(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveEffect(raw, shallowReadonlyHandlers);
}

function initProps(instance, rawProps) {
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
    instance.props = shallowReadonly(rawProps || {});
}

const publidPropertyMap = {
    $el: (i) => i.vnode.el,
    // $slots: (i) => i.slots,
    // $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (key in setupState) {
            return setupState[key];
        }
        const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        const publicGetter = publidPropertyMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function emit(event) {
    // const { props } = instance;
    // const handler = props[`on${event}`];
    // handler && handler(...args);
    console.log(event);
}

function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        props: vnode.props,
        slots: vnode.slots,
        proxy: null, // 代理对象
        emit: () => { }, // 事件
    };
    instance.emit = emit;
    return instance;
}
function setupComponent(instance) {
    // 初始化组件
    initProps(instance, instance.vnode.props);
    // initSlots(instance)
    // 处理组件的setup
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 先拿到组件
    const Component = instance.type;
    // 创建代理对象
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component; //解构出setup
    console.log('setup:', setup);
    if (setup) {
        // setCurrentInstance(instance)
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit,
        });
        console.log('setupResult:', setupResult);
        // setCurrentInstance(null)
        handleSetupResult(instance, setupResult);
    }
    else {
        finishComponentSetup(instance);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object' && setupResult !== null) {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance); // 处理组件的render
}
function finishComponentSetup(instance) {
    // 拿到组件
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
    else {
        instance.render = instance.vnode.render;
    }
}

function render(vnode, container) {
    // 调用patch函数
    patch(vnode, container);
}
function patch(vnode, container) {
    console.log(vnode);
    console.log(vnode.type); // 打印render&setup
    console.log(container); // 打印<div id="app"></div>
    const { shapeFlag } = vnode;
    if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
        // 处理元素
        processElement(vnode, container);
    }
    else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        // 处理组件
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode); // 创建组件实例
    console.log('instance:', instance);
    setupComponent(instance); // 处理组件
    setupRenderEffect(instance, vnode, container); // 处理组件渲染
}
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type); // 创建真实dom
    const { children, props, shapeFlag } = vnode;
    if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
        el.textContent = children; // 文本节点
    }
    else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
        mountChildren(vnode, el); // 处理children
    }
    if (props) {
        for (const key in props) {
            const val = props[key]; // 拿到属性值
            const isOn = (key) => /^on[A-Z]/.test(key); // 判断是否是事件
            if (isOn(key)) {
                const event = key.slice(2).toLowerCase(); // 拿到事件名
                el.addEventListener(event, val); // 给真实dom绑定事件
            }
            else {
                el.setAttribute(key, val); // 给真实dom绑定属性
            }
        }
    }
    container.append(el); // 挂载到容器中
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container); // 递归处理children
    });
}
function setupRenderEffect(instance, vnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    console.log('subTree:', subTree);
    console.log('container:', container);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    vnode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type, // 类型
        props, // 属性
        children, // 孩子
        el: null, // 对应的真实dom
        component: null, // 组件实例
        key: props === null || props === void 0 ? void 0 : props.key, // 唯一标识
        shapeFlag: getShapeFlag(type), // 类型标识
    };
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */; // 0001 | 0100 = 0101
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */; // 0001 | 1000 = 1001
    }
    return vnode;
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? 1 /* ShapeFlags.ELEMENT */
        : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function createApp(rootComponent) {
    console.log('rootComponent:', rootComponent);
    // 传入根组件
    return {
        mount(rootContainer) {
            console.log('rootContainer:', rootContainer);
            // 挂载回根容器
            // 先把根组件转换成虚拟节点vnode
            // 之后所有的操作都会基于vnode做处理
            const vnode = createVNode(rootComponent);
            console.log('vnode:', vnode);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

export { createApp, h };
