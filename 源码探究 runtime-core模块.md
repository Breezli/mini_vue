# 源码探究 runtime-core模块

> 接下来我们将对这行核心代码的源码进行全流程追踪

```ts
createApp(App).mount("#root")
```

>注：在此之前我们已经通过
>
>```
>const rootContainer = document.querySelector('#app')
>```
>
>拿到 ***rootContainer*** ：<div id="app"></div>

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

### patch 拆箱回调

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

##### mountComponent 组件初始化分支

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

> 这里 instance 又新增了 render 属性

**如果setup不存在**

>直接处理组件的render

```ts
finishComponentSetup(instance);
```

> 到这里就是组件初始化的最底层了，接下来我们回到 *mountComponent* 完成 *setupRenderEffect* 部分

###### setupRenderEffect

> 要传入三个参数 ***instance***, ***vnode***, ***container***
>
> 已知 **container** 作为容器为<div id="app"></div>
>
> 到这里我们先梳理一下目前 **instance** & **vnode** 内部的参数
>
> | instance                      | vnode                     |    属性     |
> | :---------------------------- | :------------------------ | :---------: |
> | ✅                             | ✅                         |  children   |
> | ✅                             | ✅                         |  component  |
> | ✅                             | ✅                         |     el      |
> | ✅                             | ✅                         |     key     |
> | ✅                             | ✅                         |    props    |
> | ✅ 内部是右边vnode的前五个属性 | ⛔                         | ***vnode*** |
> | ✅ { render: ƒ, setup: ƒ }     | ✅ { render: ƒ, setup: ƒ } | ***type***  |
> | ✅                             | ⛔                         |    proxy    |
> | ✅                             | ⛔                         |    slots    |
> | ✅ { msg: 'mini-vue' }         | ⛔                         | setupState  |

```ts
export function setupRenderEffect(instance: any, vnode: any, container: any) {
    //我们先看这一部分
	const { proxy } = instance
	const subTree = instance.render.call(proxy) // 注意!是这个时候去调用render里的h函数了

	// vnode -> patch
	// vnode -> element -> mountElement
	// patch(subTree, container)
	// vnode.el = subTree.el
}
```

回顾h函数

```ts
function h(type, props, children) {
    return createVNode(type, props, children);
}
```

> 再看这时候的 type, props, children 也就是用户样例
>
> type：'div'
>
> props：{ id: 'root', class: ['red', 'hard'] }
>
> children：'hi, mini-vue'

```ts
function createVNode(type, props, children) {
    const vnode = {
        type, // 传入类型
        props, // 传入属性
        children, // 传入子节点
        el: null, 
        component: null, 
        key: props === null || props === void 0 ? void 0 : props.key, // 唯一标识
    };
    return vnode;
}
```

> 那么接下来的 ***subTree*** 结构就是
>
> **type** = 'div'
>
> **props** = { id: 'root', class: ['red', 'hard'] }
>
> **children** = 'hi, mini-vue'
>
> **el**
>
> **component**
>
> **key**

>以及 ***container*** 结构
>
>```html
><div id="app">
>	<div id="root" class="red, hard">hi, mini-vue</div>
></div>
>```

返回 **setupRenderEffect** 函数，继续看下面的逻辑

```ts
export function setupRenderEffect(instance: any, vnode: any, container: any) {
	// const { proxy } = instance
	// const subTree = instance.render.call(proxy) // 注意!是这个时候去调用render里的h函数了

	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container) //传入subtree container
	vnode.el = subTree.el
}
```

此时调用 ***patch*** 回调拆箱

```ts
function patch(vnode, container) {
    if (typeof vnode.type === 'string') { // 元素分支 <-这次进这个
        processElement(vnode, container); // 此时的 vnode.type 已经是'div'了
    }
    else if (typeof vnode.type === 'object') { // 组件分支
        processComponent(vnode);
    }
}
```

> 快进到下面的 processElement 元素分支

##### updateComponent 更新分支

> ***!!! 第一次看先掠过这一部分,先看后文 ‘processElement 元素分支’ 实现拆箱 !!!***

#### processElement 元素分支

```ts
function processElement(vnode, container) {
    mountElement(vnode, container);
}
```

##### mountElement 元素初始化分支

> 若以首次样例传入为例，进入文本节点
>
> 若以二次样例传入为例，进入数组节点

```ts
function mountElement(vnode, container) {
    const el = document.createElement(vnode.type); // 创建真实dom <div></div>
    const { children, props } = vnode; 
    // (首次)解构为
    // 'hi, mini-vue'
    // { id: 'root', class: ['red', 'hard'] }
    // (二次)解构为
    // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]
    // { id: 'root', class: ['red', 'hard'] }
    
    if (typeof children === 'string') { // 文本节点(首次样例)
        el.textContent = children; // 直接把'hi, mini-vue'插入到<div></div>下0位处
    }
    else if (Array.isArray(children)) { // 数组节点(二次样例)
        mountChildren(vnode, el); // 拆分数组 + patch回调 (此时el是<p>,container是<div>)
    }
    
    if (props) {
        for (const key in props) { // 遍历key
            const val = props[key]; // 拿到属性值val
            el.setAttribute(key, val); // Web内置API,把键值对嵌入div标签
        }
    }
    
    container.append(el); // Web内置API,把el挂载到容器中
    // (首次)挂载为
    // container : <div id="app"></div>
    // el : <div id="root" class="red,hard"></div>
    // (二次)挂载为
    // container : <div id="root" class="red,hard"></div>
    // el : <p class="..."></p>
}
```

> (首次样例) for (const key in props) 的过程
>
> ```html
> <div id="root">...</div>
> ```
>
> ```html
> <div id="root" class="red,hard">...</div>
> ```

>(首次样例) container.append(el) 的结果
>
>```html
><!-- container -->
><div id="app">...</div>
>> 0 = <div id="root" class="red, hard">...</div>
>> > 0 = hi, mini-vue
>```

此时返回 ***setupRenderEffect*** 的最后一行

```ts
vnode.el = subTree.el
```

> 此时打开html网页，就可以看到屏幕上的 hi, mini-vue 字样了

***!!! 二次复盘 !!!***

> 现在我们将 h 的 children 参数改成数组
>
> ```ts
> return h( // 创建虚拟 DOM 节点,接收三个参数
>     'div',
>     { id: 'root', class: ['red', 'hard'] },
>     // 'hi, mini-vue' //string类型
>     [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')] // array类型
> )
> ```
>
> 并且在index.html中添加css样式
>
> ```html
> ...
> 	<title>Document</title>
> 	<style>
> 		.red {
> 			color: red;
> 		}
> 		.blue {
> 			color: blue;
> 		}
> 	</style>
> ...
> ```

还记得children判断类型的分支吗，就在刚写的 ***mountElement*** 函数里，返回去再看看，看完再回到这里

###### mountChildren

> 所以现在二次样例中的数据如下
>
> **vnode.children** 子节点标签数组
>
> ```ts
> [
>     h('p', { class: 'red' }, 'hi'),
>     h('p', { class: 'blue' }, 'mini-vue')
> ]
> ```
>
> **container** 根容器
>
> ```html
> <div id="app">...</div>
> ```

```ts
function mountChildren(vnode: any, container: any) {
	vnode.children.forEach((v: any) => {
		patch(v, container) // 递归处理children
	})
}
```

>取出来的 ***v*** 依此是
>
>|              |   第一次 (调用h)   |   第二次 (调用h)    |
>| :----------: | :----------------: | :-----------------: |
>|   **type**   |         p          |          p          |
>|  **props**   | { class: ' red ' } | { class: ' blue ' } |
>| **children** |       ' hi '       |    ' mini-vue '     |













