'use strict';

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
        const publicGetter = publidPropertyMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    },
};

function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        props: vnode.props,
        slots: vnode.slots,
        proxy: vnode.proxy, // 代理对象
    };
    return instance;
}
function setupComponent(instance) {
    // 初始化组件
    // initProps(instance)
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
        const setupResult = setup();
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
    if (typeof vnode.type === 'string') {
        // 处理元素
        processElement(vnode, container);
    }
    else if (typeof vnode.type === 'object') {
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
    const { children, props } = vnode;
    if (typeof children === 'string') {
        el.textContent = children; // 文本节点
    }
    else if (Array.isArray(children)) {
        mountChildren(vnode, el); // 处理children
    }
    if (props) {
        for (const key in props) {
            const val = props[key]; // 拿到属性值
            el.setAttribute(key, val); // 给真实dom设置属性
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
        // shapeFlag: getShapeFlag(type), // 类型标识
    };
    return vnode;
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

exports.createApp = createApp;
exports.h = h;
