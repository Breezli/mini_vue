# 源码探究 runtime-core模块

///***TODO:明天将补充全程数据流变化***///

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
>  return {
>      msg: 'mini-vue',
>  }
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
>  'div',
>  { id: 'root', class: ['red', 'hard'] },
>  // 'hi, mini-vue' //string类型
>  [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')] // array类型
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
>  h('p', { class: 'red' }, 'hi'),
>  h('p', { class: 'blue' }, 'mini-vue')
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





# 补充

## Proxy对象

```js
const p = new Proxy(target, handler)
```

> target : <obj> 包装的目标
>
> handler : <f> 执行各种操作时代理 `p` 的行为

**基础**

```js
const handler = {
  get: function (obj, prop) {
    return prop in obj ? obj[prop] : 37;//当对象中不存在属性名时，默认返回值为 37
  },
};

const p = new Proxy({}, handler);
p.a = 1;
p.b = undefined;

console.log(p.a, p.b); // 1, undefined
console.log("c" in p, p.c); // false, 37
```

**无操作转发代理**

```ts
let target = {};
let p = new Proxy(target, {});

p.a = 37; // 操作转发到目标

console.log(target.a); // 37. 操作已经被正确地转发
```

**验证**

```ts
let validator = {
    set: function (obj, prop, value) {
        if (prop === "age") {
            if (!Number.isInteger(value)) {
                throw new TypeError("The age is not an integer");
            }
            if (value > 200) {
                throw new RangeError("The age seems invalid");
            }
        }

        // The default behavior to store the value
        obj[prop] = value;

        // 表示成功
        return true;
    },
};

let person = new Proxy({}, validator);

person.age = 100;

console.log(person.age);
// 100

person.age = "young";
// 抛出异常：Uncaught TypeError: The age is not an integer

person.age = 300;
// 抛出异常：Uncaught RangeError: The age seems invalid
```

**扩展构造函数**

```ts
function extend(sup, base) {
    var descriptor = Object.getOwnPropertyDescriptor(
        base.prototype,
        "constructor",
    );
    base.prototype = Object.create(sup.prototype);
    var handler = {
        construct: function (target, args) {
            var obj = Object.create(base.prototype);
            this.apply(target, obj, args);
            return obj;
        },
        apply: function (target, that, args) {
            sup.apply(that, args);
            base.apply(that, args);
        },
    };
    var proxy = new Proxy(base, handler);
    descriptor.value = proxy;
    Object.defineProperty(base.prototype, "constructor", descriptor);
    return proxy;
}

var Person = function (name) {
    this.name = name;
};

var Boy = extend(Person, function (name, age) {
    this.age = age;
});

Boy.prototype.sex = "M";

var Peter = new Boy("Peter", 13);
console.log(Peter.sex); // "M"
console.log(Peter.name); // "Peter"
console.log(Peter.age); // 13
```

**值修正与属性附加**

```ts
let products = new Proxy(
  {
    browsers: ["Internet Explorer", "Netscape"],
  },
  {
    get: function (obj, prop) {
      // 附加一个属性
      if (prop === "latestBrowser") {
        return obj.browsers[obj.browsers.length - 1];
      }

      // 默认行为是返回属性值
      return obj[prop];
    },
    set: function (obj, prop, value) {
      // 附加属性
      if (prop === "latestBrowser") {
        obj.browsers.push(value);
        return;
      }

      // 如果不是数组，则进行转换
      if (typeof value === "string") {
        value = [value];
      }

      // 默认行为是保存属性值
      obj[prop] = value;

      // 表示成功
      return true;
    },
  },
);

console.log(products.browsers); // ['Internet Explorer', 'Netscape']
products.browsers = "Firefox"; // 如果不小心传入了一个字符串
console.log(products.browsers); // ['Firefox'] <- 也没问题，得到的依旧是一个数组

products.latestBrowser = "Chrome";
console.log(products.browsers); // ['Firefox', 'Chrome']
console.log(products.latestBrowser); // 'Chrome'
```

**通过属性查找数组中的特定对象**

```ts
let products = new Proxy(
    [
        { name: "Firefox", type: "browser" },
        { name: "SeaMonkey", type: "browser" },
        { name: "Thunderbird", type: "mailer" },
    ],
    {
        get: function (obj, prop) {
            // 默认行为是返回属性值，prop 通常是一个整数
            if (prop in obj) {
                return obj[prop];
            }

            // 获取 products 的 number; 它是 products.length 的别名
            if (prop === "number") {
                return obj.length;
            }

            let result,
                types = {};

            for (let product of obj) {
                if (product.name === prop) {
                    result = product;
                }
                if (types[product.type]) {
                    types[product.type].push(product);
                } else {
                    types[product.type] = [product];
                }
            }

            // 通过 name 获取 product
            if (result) {
                return result;
            }

            // 通过 type 获取 products
            if (prop in types) {
                return types[prop];
            }

            // 获取 product type
            if (prop === "types") {
                return Object.keys(types);
            }

            return undefined;
        },
    },
);

console.log(products[0]); // { name: 'Firefox', type: 'browser' }
console.log(products["Firefox"]); // { name: 'Firefox', type: 'browser' }
console.log(products["Chrome"]); // undefined
console.log(products.browser); // [{ name: 'Firefox', type: 'browser' }, { name: 'SeaMonkey', type: 'browser' }]
console.log(products.types); // ['browser', 'mailer']
console.log(products.number); // 3
```

**源码使用**

```ts
function setupStatefulComponent(instance) {
 // proxy 对象其实是代理了 instance.ctx 对象
 // 我们在使用的时候需要使用 instance.proxy 对象
 // 因为 instance.ctx 在 prod 和 dev 坏境下是不同的
 instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers);
 // const Component = {setup(),render()} ....
 const Component = instance.type;

 const { setup } = Component;
 if (setup) {
     // 设置当前 currentInstance 的值
     // 必须要在调用 setup 之前
     setCurrentInstance(instance);

     const setupContext = createSetupContext(instance);
     // 真实的处理场景里面应该是只在 dev 环境才会把 props 设置为只读的
     const setupResult =
           setup && setup(shallowReadonly(instance.props), setupContext);

     setCurrentInstance(null);

     // 3. 处理 setupResult
     handleSetupResult(instance, setupResult);
 } else {
     finishComponentSetup(instance);
 }
}
```



# 其他拆分详解

## subTree

拆分核心

```ts
const subTree = (instance.subTree = instance.render.call(instance.proxy))
```

位于SetupRenderEffect函数

> 简化版
>
> ```ts
> function setupRenderEffect(instance, container) {
>  instance.update = effect(() => {
>      if (!instance.isMounted) {
>          // 执行 render 函数生成子树
>          const subTree = (instance.subTree = instance.render.call(instance.proxy))
> 
>          // 递归 patch 子树
>          patch(null, subTree, container)
> 
>          instance.isMounted = true
>      }
>  })
> }
> ```

> 完整版
>
> ```ts
> function setupRenderEffect(instance, initialVNode, container) {
>     // 调用 render
>     // 应该传入 ctx 也就是 proxy
>     // ctx 可以选择暴露给用户的 api
>     // 源代码里面是调用的 renderComponentRoot 函数
>     // 这里为了简化直接调用 render
> 
>     // obj.name  = "111"
>     // obj.name = "2222"
>     // 从哪里做一些事
>     // 收集数据改变之后要做的事 (函数)
>     // 依赖收集   effect 函数
>     // 触发依赖
>     function componentUpdateFn() {
>         if (!instance.isMounted) {
>             // 组件初始化的时候会执行这里
>             // 为什么要在这里调用 render 函数呢
>             // 是因为在 effect 内调用 render 才能触发依赖收集
>             // 等到后面响应式的值变更后会再次触发这个函数
>             console.log(`${instance.type.name}:调用 render,获取 subTree`);
>             const proxyToUse = instance.proxy;
>             // 可在 render 函数中通过 this 来使用 proxy
>             const subTree = (instance.subTree = normalizeVNode(
>                 instance.render.call(proxyToUse, proxyToUse)
>             ));
>             console.log("subTree", subTree);
> 
>             // todo
>             console.log(`${instance.type.name}:触发 beforeMount hook`);
>             console.log(`${instance.type.name}:触发 onVnodeBeforeMount hook`);
> 
>             // 这里基于 subTree 再次调用 patch
>             // 基于 render 返回的 vnode ，再次进行渲染
>             // 这里我把这个行为隐喻成开箱
>             // 一个组件就是一个箱子
>             // 里面有可能是 element （也就是可以直接渲染的）
>             // 也有可能还是 component
>             // 这里就是递归的开箱
>             // 而 subTree 就是当前的这个箱子（组件）装的东西
>             // 箱子（组件）只是个概念，它实际是不需要渲染的
>             // 要渲染的是箱子里面的 subTree
>             patch(null, subTree, container, null, instance);
>             // 把 root element 赋值给 组件的vnode.el ，为后续调用 $el 的时候获取值
>             initialVNode.el = subTree.el;
> 
>             console.log(`${instance.type.name}:触发 mounted hook`);
>             instance.isMounted = true;
>         } else {
>             // 响应式的值变更后会从这里执行逻辑
>             // 主要就是拿到新的 vnode ，然后和之前的 vnode 进行对比
>             console.log(`${instance.type.name}:调用更新逻辑`);
>             // 拿到最新的 subTree
>             const { next, vnode } = instance;
> 
>             // 如果有 next 的话， 说明需要更新组件的数据（props，slots 等）
>             // 先更新组件的数据，然后更新完成后，在继续对比当前组件的子元素
>             if (next) {
>                 // 问题是 next 和 vnode 的区别是什么
>                 next.el = vnode.el;
>                 updateComponentPreRender(instance, next);
>             }
> 
>             const proxyToUse = instance.proxy;
>             const nextTree = normalizeVNode(
>                 instance.render.call(proxyToUse, proxyToUse)
>             );
>             // 替换之前的 subTree
>             const prevTree = instance.subTree;
>             instance.subTree = nextTree;
> 
>             // 触发 beforeUpdated hook
>             console.log(`${instance.type.name}:触发 beforeUpdated hook`);
>             console.log(`${instance.type.name}:触发 onVnodeBeforeUpdate hook`);
> 
>             // 用旧的 vnode 和新的 vnode 交给 patch 来处理
>             patch(prevTree, nextTree, prevTree.el, null, instance);
> 
>             // 触发 updated hook
>             console.log(`${instance.type.name}:触发 updated hook`);
>             console.log(`${instance.type.name}:触发 onVnodeUpdated hook`);
>         }
>     }
> 
>     // 在 vue3.2 版本里面是使用的 new ReactiveEffect
>     // 至于为什么不直接用 effect ，是因为需要一个 scope  参数来收集所有的 effect
>     // 而 effect 这个函数是对外的 api ，是不可以轻易改变参数的，所以会使用  new ReactiveEffect
>     // 因为 ReactiveEffect 是内部对象，加一个参数是无所谓的
>     // 后面如果要实现 scope 的逻辑的时候 需要改过来
>     // 现在就先算了
>     instance.update = effect(componentUpdateFn, {
>         scheduler: () => {
>             // 把 effect 推到微任务的时候在执行
>             // queueJob(effect);
>             queueJob(instance.update);
>         },
>     });
> }
> ```

回顾当前 instance 的结构

```js
{
  type: App,          // setup{},render{}
  vnode,              // 关联的 VNode
  props: {},          // 初始化为空对象（根组件无 props）
  parent,
  provides: parent ? parent.provides : {}, // 获取 parent 的 provides 作为当前组件的初始化值 这样就可以继承 parent.provides 的属性了
  setupState: {},     // setup() 返回值（此时已经是{ msg: 'mini-vue' }）
  render: function,   // 来自 App.render
  subTree: null,      // 待渲染的子树（子树缓存）
  isMounted: false,   // 是否初始化过
  update: null
  ctx: {_: instance}, // 上下文对象，保留实例引用
  attrs: {},		  // 未声明的属性
  slots: {},		  // 插槽内容
  emit: () => {		  // 事件触发器
      emit.bind(null, instance) as any
  },
}
```

接下我们将进行逐步拆分

```
const subTree = (instance.subTree = instance.render.call(instance.proxy))
```













