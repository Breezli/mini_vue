# 源码探究 runtime-core模块

> 接下来我们将对这行代码的源码进行全流程追踪

```ts
createApp(App).mount("#root")
```

拆分成两个步骤

>createApp(App)
>
>.mount("#root")

## createApp(App)

### 关于App

我们先来看用户这边的操作

App.js

```ts
export const App = {
    render() { // UI逻辑
        return h( // Vue 中的创建虚拟 DOM 的辅助函数,用于创建虚拟 DOM 节点,接收三个参数：
            'div', // type：要创建的 HTML 标签名或组件选项对象.
            { id: 'root', class: ['red', 'hard'] }, // props：标签属性,可以是一个 对象 或 数组.
            'hi, ' + this.msg // children：子节点,可以是 字符串、数字、数组、其他虚拟 DOM 节点.
        )
    },
    setup() { // 组合式 API 的入口点,用于组合组件的逻辑，例如响应式数据、生命周期钩子、计算属性等
        return {
            msg: 'mini-vue',
        }
    },
}
```

> 这里给h辅助函数传入三个参数
>
> ***type***：要创建的 HTML 标签名或组件选项对象(div)
>
> ***props***：标签属性,可以是一个 对象 或 数组
>
> ***children***：子节点,可以是 字符串、数字、数组、其他虚拟 DOM 节点

来看看h辅助函数

```ts
function h(type, props, children) {
    return createVNode(type, props, children);
}
```

接着createVNode

```ts
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
```

> 现在App的结构就变成了这样
>
> render()
>
> >```json
> >type, // 类型
> >props, // 属性
> >children, // 孩子
> >el: null, // 对应的真实dom
> >component: null, // 组件实例
> >key: props === null || props === void 0 ? void 0 : props.key, // 唯一标识
> >```
>
> setup()

### 关于createApp

> 传入结构App->rootComponent

```ts
function createApp(rootComponent) {//rootComponent就是App
    return {
        mount(rootContainer) {//.mount方法的扩展
            const vnode = createVNode(rootComponent);
            render(vnode, rootContainer);
        },
    };
}
```

> 由此进入.mount("#root")部分

## .mount("#root")

> 接着看mount方法的内部
>
> // 挂载回根容器
> // 先把根组件转换成虚拟节点vnode
> // 之后所有的操作都会基于vnode做处理

```ts
function createApp(rootComponent) { // rootComponent 就是 {render: ƒ, setup: ƒ}
    return {
        mount(rootContainer) { // rootContainer 就是 div#app
            const vnode = createVNode(rootComponent); // 根组件转换成虚拟节点vnode
            render(vnode, rootContainer); // 将 vnode 渲染到 container 中
            // 之后所有的操作都会基于vnode做处理
        },
    };
}
```

### createVNode

>rootComponent 传进来了 {render: ƒ, setup: ƒ}

```ts
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
```

> 现在 {render: ƒ, setup: ƒ} 被挂到了虚拟节点的第一个属性 ***type*** 上

> 现在 ***vnode*** 的结构就变成了这样
>
> **type**
>
> >render()
> >
> >>```json
> >>type, // 类型
> >>props, // 属性
> >>children, // 孩子
> >>el: null, // 对应的真实dom
> >>component: null, // 组件实例
> >>key: props === null || props === void 0 ? void 0 : props.key, // 唯一标识
> >>```
> >
> >setup()
>
> **props**
>
> **children**
>
> **el**
>
> **component**
>
> **key**

### render

```ts
render(vnode, rootContainer); // 将 vnode 渲染到 container 中
```

>vnode : 刚才写的结构👆
>
>rootContainer : div#app

```ts
function render(vnode, container) { // 直接指向patch函数
    patch(vnode, container);
}
```

### patch

> 拆箱函数，深层回调的起点

```ts
function patch(vnode, container) {
    if (typeof vnode.type === 'string') { // 元素分支
        processElement(vnode, container);
    }
    else if (typeof vnode.type === 'object') { // 组件分支
        processComponent(vnode);
    }
}
```

#### processComponent 组件分支（首次进入）

```ts
function processComponent(vnode, container) {
    mountComponent(vnode);
}
```

##### mountComponent 初始化分支

```ts
function mountComponent(vnode, container) {
    const instance = createComponentInstance(vnode); // 创建组件实例
    setupComponent(instance); // 处理组件
    setupRenderEffect(instance, vnode, container) // 处理组件渲染
}
```

###### createComponentInstance

```ts
function createComponentInstance(vnode) {
    const instance = {
        vnode,
        type: vnode.type,
        props: vnode.props,
        slots: vnode.slots, // 插槽
        proxy: null, // 代理对象
    };
    return instance;
}
```

> 返回的 ***instance*** 结构
>
> **vnode**(新增) ：继承当前传过来的整个 vnode 结构
>
> **type**
>
> >render()
> >
> >>```json
> >>type, // 类型
> >>props, // 属性
> >>children, // 孩子
> >>el: null, // 对应的真实dom
> >>component: null, // 组件实例
> >>key: props === null || props === void 0 ? void 0 : props.key, // 唯一标识
> >>```
> >
> >setup()
>
> **props**
>
> **slots**(新增)
>
> **proxy**(新增)
>
> **children**
>
> **el**
>
> **component**
>
> **key**

###### setupComponent

>instance的结构见上👆

```ts
function setupComponent(instance) { // 初始化组件
    initProps(instance);
    initSlots(instance);
    setupStatefulComponent(instance); // 处理组件的setup
}
```

**setupStatefulComponent**

> 按这个例子来说，解构出来的 setup 结构为
>
> ```ts
> ƒ setup() {
>     return {
>         msg: 'mini-vue',
>     }
> }
> ```

```ts
function setupStatefulComponent(instance) {
    const Component = instance.type; // 先拿到组件 {render: ƒ, setup: ƒ}

    const { setup } = Component; //解构出setup(结构见上面注释)
    
    if (setup) {
        // setCurrentInstance(instance)
        const setupResult = setup(); // {msg: 'mini-vue'}
        // setCurrentInstance(null)
        handleSetupResult(instance, setupResult); // instance & {msg: 'mini-vue'}
    }
    else {
        finishComponentSetup(instance);
    }

    //下面这个先留个坑🕳后面看
    instance.proxy = new Proxy(instance, { // 创建代理对象
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
}
```

**如果setup存在**

handleSetupResult （处理组件的setup）

>传入 instance & {msg: 'mini-vue'}

```ts
function handleSetupResult(instance: any, setupResult: any) {
	if (typeof setupResult === 'object' && setupResult !== null) {
		instance.setupState = setupResult // instance新增属性setupState
	}
	finishComponentSetup(instance) // 处理组件的render
}
```

finishComponentSetup （处理组件的render）

```ts
function finishComponentSetup(instance) {
    const Component = instance.type; // 先拿到组件 {render: ƒ, setup: ƒ}
    
    if (Component.render) {
        instance.render = Component.render;
    }
    else {
        instance.render = instance.vnode.render;
    }
}
```

**如果setup不存在**

>直接处理组件的render

```ts
finishComponentSetup(instance);
```

> 到这里就是组件初始化的最底层了，接下来我们回到 *mountComponent* 完成 *setupRenderEffect* 部分

###### setupRenderEffect

```ts
export function setupRenderEffect(instance: any, vnode: any, container: any) {
	const { proxy } = instance
	const subTree = instance.render.call(proxy)

    console.log('subTree:', subTree)

	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container)

	vnode.el = subTree.el
}
```



##### updateComponent 更新分支







#### processElement 元素分支



