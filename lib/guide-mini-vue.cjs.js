'use strict';

function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        props: vnode.props,
        slots: vnode.slots,
        proxy: null,
    };
    return instance;
}
function setupComponent(instance) {
    // 初始化组件
    initProps(instance);
    initSlots(instance);
    // 处理组件的setup
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    // 先拿到组件
    const Component = instance.type;
    // 代理对象
    instance.proxy = new Proxy(instance, {
        get(target, key) {
            const { setup, props } = target;
            if (key in setup) {
                return setup[key];
            }
            else if (key in props) {
                return props[key];
            }
            return Reflect.get(target, key);
        }
    });
    const { setup } = Component; //解构出setup
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup();
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
    else {
        finishComponentSetup(instance);
    }
}
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult;
    }
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (Component.render) {
        instance.render = Component.render;
    }
    else {
        instance.render = instance.vnode.render;
    }
    // 处理组件的render，调用render函数
    setupRenderEffect(instance);
}

function render(vnode, container) {
    // 调用patch函数
    patch(vnode, container);
}
function patch(vnode, container) {
    if (vnode.shapeFlag === 1) {
        // 处理element
        processElement(vnode, container);
    }
    else if (vnode.shapeFlag === 8) {
        // 处理component
        processComponent(vnode, container);
    }
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    // 创建组件实例对象
    const instance = createComponentInstance(vnode);
    // 处理组件的setup
    setupComponent(instance);
    // 处理组件的render
    setupRenderEffect$1(instance, vnode, container);
}
function setupRenderEffect$1(instance, vnode, container) {
    const { proxy } = instance;
    const subTree = instance.render.call(proxy);
    // vnode -> patch
    // vnode -> element -> mountElement
    patch(subTree, container);
    vnode.el = subTree.el;
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        el: null,
        component: null,
        key: props === null || props === void 0 ? void 0 : props.key,
        // shapeFlag: getShapeFlag(type),
    };
    return vnode;
}

function createApp(rootComponent) {
    // 传入根组件
    return {
        mount(rootContainer) {
            // 挂载回根容器
            // 先把根组件转换成虚拟节点vnode
            // 之后所有的操作都会基于vnode做处理
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

exports.createApp = createApp;
exports.h = h;
