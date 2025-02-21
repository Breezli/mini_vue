# mini-vue搭建笔记

# 原理概况

```
https://github.com/cuixiaorui/mini-vue
```

## Vue3模块组织方式

### 流程图

<img src="C:\Users\DELL\AppData\Roaming\Typora\typora-user-images\image-20250219223855962.png" alt="image-20250219223855962" style="zoom:50%;" />

#### 处理编译

>`compiler-sfc`专门解析sfc (使用rollup-vue***把App.vue单文件组件编译成JS***)
>
>> <img src="C:\Users\DELL\AppData\Roaming\Typora\typora-user-images\image-20250219224321994.png" alt="image-20250219224321994" style="zoom: 67%;" />
>
>`compiler-dom`依赖core，处理template标签，***把template编译转化成一个render函数***
>
>`compiler-core`给dom提供依赖

#### 处理运行时

>`runtime-dom`依赖core
>
>`runtime-core`***最重点的核心代码***
>
>`runtime-reactivity`实现vue的***响应式***

# runtime-reactivity 响应式系统

## 主流程 | 脑图

![image-20250220163321605](C:\Users\DELL\AppData\Roaming\Typora\typora-user-images\image-20250220163321605.png)

### reactive 响应式设置

> ***reactivity核心API***
>
> **`reactive()`**创建**对象类型**的响应式数据：
>
> ```js
> import { reactive } from 'vue';
> const state = reactive({ count: 0 });
> state.count++; // 修改后视图自动更新
> ```
>
> **`ref()`**创建**任意类型**的响应式数据（通过 `.value` 访问）：
>
> ```js
> import { ref } from 'vue';
> const num = ref(0);
> num.value = 10; // 修改需使用 .value
> ```
>
> **`computed()`**创建依赖其他数据的计算属性：
>
> ```js
> const doubleCount = computed(() => state.count * 2);
> ```
>
> **`watch()` 和 `watchEffect()`**监听数据变化执行副作用：
>
> ```js
> watch(num, (newVal) => console.log('num变化:', newVal));
> watchEffect(() => console.log('count变化:', state.count));
> ```

#### reactive 单测

reactivity / tests / reactive.spec.ts

```ts
import { reactive, isReactive, toRaw, reactiveMap } from "../src/reactive";
```

>`reactive`: 将普通对象转换为响应式对象。
>`isReactive`: 检查一个对象是否是响应式对象。
>`toRaw`: 获取响应式对象对应的原始对象。
>`reactiveMap`: 内部使用的 Map 数据结构，用于存储原始对象和响应式对象之间的映射关系。

```ts
describe("reactive", () => {
  test("Object", () => {//测试用例1 | 基本功能：确保 reactive 方法能够正确地将普通对象转换为响应式对象。
    const original = { foo: 1 };
    const observed = reactive(original);//将普通对象转换为响应式对象
    expect(observed).not.toBe(original);//确保 reactive 返回的对象与原始对象不是同一个引用
    expect(isReactive(observed)).toBe(true);//验证 observed 是响应式对象
    expect(isReactive(original)).toBe(false);//而 original 不是
    expect(observed.foo).toBe(1);//可读取
    expect("foo" in observed).toBe(true);//存在
    expect(Object.keys(observed)).toEqual(["foo"]);//自有属性键名
  });

  test("nested reactives", () => {//测试用例2 | 嵌套对象支持：确保嵌套对象和数组也能被正确转换为响应式对象。
    const original = {//定义一个复杂对象
      nested: {//嵌套对象
        foo: 1,
      },
      array: [{ bar: 2 }],//数组
    };
    const observed = reactive(original);//将复杂对象转换为响应式对象
    expect(isReactive(observed.nested)).toBe(true);
    expect(isReactive(observed.array)).toBe(true);
    expect(isReactive(observed.array[0])).toBe(true);
  });

  test("toRaw", () => {//测试用例3 | toRaw 方法：确保可以正确地从响应式对象中获取原始对象。
    const original = { foo: 1 };
    const observed = reactive(original);
    expect(toRaw(observed)).toBe(original);//确保通过 toRaw 方法可以从响应式对象 observed 中获取原始对象 original
    expect(toRaw(original)).toBe(original);//如果直接对原始对象调用 toRaw，应该返回原始对象本身
  });
});
```

#### reactive 源码实现（*Proxy*）

```ts
export function reactive(target) {
  return createReactiveObject(target, reactiveMap, mutableHandlers);
}
```

👇

```ts
function createReactiveObject(target, proxyMap, baseHandlers) {//原理是JS创建的Proxy对象，目的是可以侦听到用户 get 或者 set 的动作
    
  const existingProxy = proxyMap.get(target);//先检查 proxyMap 中是否已经存在与当前 target 对应的代理对象。
  if (existingProxy) {//存在则直接返回缓存中的代理对象，避免重复创建。
    return existingProxy;
  }

  //target 被代理的目标对象
  //baseHandlers 一个拦截器对象，定义了代理的行为（例如如何处理 get 和 set 操作）
  const proxy = new Proxy(target, baseHandlers);

  proxyMap.set(target, proxy);//把创建好的 proxy 给存起来
  return proxy;
}
```

> 另：回顾Proxy功能 | 可在用户对目标对象的***访问(get)***和***修改(set)***操作中，自定义逻辑（如触发依赖更新）
>
> ```ts
> // 定义一个目标对象
> const target = { count: 0 };
> 
> // 创建一个 Proxy 对象
> const reactiveObj = new Proxy(target, {
>   get(target, key, receiver) {
>     console.log(`Getting ${key}`);
>     return Reflect.get(target, key, receiver);
>   },
>   set(target, key, value, receiver) {
>     console.log(`Setting ${key} to ${value}`);
>     const result = Reflect.set(target, key, value, receiver);
>     if (result) {
>       console.log("Trigger updates...");
>     }
>     return result;
>   }
> });
> 
> // 测试
> console.log(reactiveObj.count); // 输出: Getting count
> reactiveObj.count++; // 输出: Setting count to 1 和 Trigger updates...
> ```

### init 初始化

#### effect 单测

> ***effect 函数功能***
>
> 当依赖的数据发生变化时，自动重新执行指定的函数。
>
> ```ts
> import { reactive, effect } from '@vue/reactivity';
> 
> const state = reactive({ count: 0 });
> 
> // effect函数
> effect(() => {
>   console.log(`Count is ${state.count}`);
> });
> 
> // 修改状态
> state.count++; // 输出: Count is 1
> state.count++; // 输出: Count is 2
> ```
>
> 手动停止 `effect`
>
> ```ts
> // 创建一个 effect 并获取停止函数
> const stop = effect(() => {
>   console.log(`Count is ${state.count}`);
> });
> 
> // 修改状态
> state.count++; // 输出: Count is 1
> // 停止 effect
> stop();
> // 再次修改状态，但 effect 不再触发
> state.count++; // 无输出
> ```

```ts
import { reactive } from "../src/reactive";
import { effect, stop } from "../src/effect";
import { vi } from "vitest";

describe("effect", () => {
  it("should run the passed function once (wrapped by a effect)", () => { //验证 effect 函数是否会立即执行传入的函数一次
    const fnSpy = vi.fn(() => {});//创建一个间谍函数fnSpy
    effect(fnSpy);//fnSpy作为参数传递给effect函数
    expect(fnSpy).toHaveBeenCalledTimes(1);//验证fnSpy是否被调用了一次
  });

  it("should observe basic properties", () => {//验证 effect 函数是否能够观察到响应式对象的基本属性的变化
    let dummy;
    const counter = reactive({ num: 0 });
    effect(() => (dummy = counter.num));//使用 effect 函数包裹一个箭头函数，该函数将 counter.num 的值赋给 dummy。
    
    expect(dummy).toBe(0);
    counter.num = 7;
    expect(dummy).toBe(7);
  });

  it("should observe multiple properties", () => {//验证 effect 函数是否能够观察到响应式对象的多个属性的变化
    let dummy;
    const counter = reactive({ num1: 0, num2: 0 });
    effect(() => (dummy = counter.num1 + counter.num1 + counter.num2));
    
    expect(dummy).toBe(0);
    counter.num1 = counter.num2 = 7;
    expect(dummy).toBe(21);
  });

  it("should handle multiple effects", () => {//验证 effect 函数是否能够处理多个响应式依赖
    let dummy1, dummy2;
    const counter = reactive({ num: 0 });
    effect(() => (dummy1 = counter.num));
    effect(() => (dummy2 = counter.num));

    expect(dummy1).toBe(0);
    expect(dummy2).toBe(0);
    counter.num++;
    expect(dummy1).toBe(1);
    expect(dummy2).toBe(1);
  });

  it("should observe nested properties", () => {//验证 effect 函数是否能够观察到嵌套属性的变化
    let dummy;
    const counter = reactive({ nested: { num: 0 } });
    effect(() => (dummy = counter.nested.num));

    expect(dummy).toBe(0);
    counter.nested.num = 8;
    expect(dummy).toBe(8);
  });

  it("should observe function call chains", () => {//验证 effect 函数是否能够观察到函数调用链的变化
    let dummy;
    const counter = reactive({ num: 0 });
    effect(() => (dummy = getNum()));

    function getNum() {
      return counter.num;
    }

    expect(dummy).toBe(0);
    counter.num = 2;
    expect(dummy).toBe(2);
  });

  it("scheduler", () => {//验证 effect 函数是否能够正确地调用 scheduler 函数
    let dummy;
    let run: any;
    const scheduler = vi.fn(() => {
      run = runner;
    });
    const obj = reactive({ foo: 1 });
    const runner = effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // // should not run yet
    expect(dummy).toBe(1);
    // // manually run
    run();
    // // should have run
    expect(dummy).toBe(2);
  });

  it("stop", () => {//验证 effect 函数是否能够正确地停止观察
    let dummy;
    const obj = reactive({ prop: 1 });
    const runner = effect(() => {
      dummy = obj.prop;
    });
    obj.prop = 2;
    expect(dummy).toBe(2);
    stop(runner);
    // obj.prop = 3
    obj.prop++;
    expect(dummy).toBe(2);

    // stopped effect should still be manually callable
    runner();
    expect(dummy).toBe(3);
  });

  it("events: onStop", () => {//验证 effect 函数是否能够正确地触发 onStop 事件
    const onStop = vi.fn();
    const runner = effect(() => {}, {
      onStop,
    });

    stop(runner);
    expect(onStop).toHaveBeenCalled();
  });
});
```

#### effect 源码实现

**effect函数**

```ts
export function effect(fn, options = {}) {
    //fn：用户传入的副作用函数，该函数内部通常会访问响应式数据，当这些响应式数据发生变化时，fn 会被重新执行。
    //options：一个可选的配置对象，默认值为空对象 {}。
    const _effect = new ReactiveEffect(fn);

    extend(_effect, options);//将用户传入的 options 配置对象合并到_effect 实例上，但不容易直接看出 _effect 实例上有哪些额外的属性
    _effect.run();//调用内部run方法

    // 将 _effect.run 方法绑定到 _effect 实例上，创建一个新的函数 runner
    // 当调用 runner 函数时，实际上是调用 _effect.run 方法
    const runner: any = _effect.run.bind(_effect);
    //在 runner 函数上添加一个 effect 属性，指向 _effect 实例
    runner.effect = _effect;
    return runner;
}
```

##### 执行fn

**ReactiveEffect类**

```ts
export class ReactiveEffect {
  active = true; //标记该副作用函数是否处于活跃状态
  deps = []; //存储该副作用函数的所有依赖项
  public onStop?: () => void; //副作用函数停止时的回调
  constructor(public fn, public scheduler?) {
    console.log("创建 ReactiveEffect 对象");
  }

  run() {
    console.log("run");
      
    //如果 this.active 为 false，表示该副作用函数已经被停止（调用了 stop 方法），此时直接执行 this.fn() 并返回结果，不进行依赖收集。
    if (!this.active) {
      return this.fn();
    }

    shouldTrack = true;//全局变量，控制是否进行依赖收集。true表示开始收集依赖。
    activeEffect = this as any;//全局变量，存储当前正在执行的副作用函数。this表示当前正在执行的副作用函数是 ReactiveEffect 的实例。
      
    console.log("执行用户传入的 fn");
    const result = this.fn();

    shouldTrack = false;//停止依赖收集。
    activeEffect = undefined;//当前没有正在执行的副作用函数。

    return result;
  }

  stop() {
    if (this.active) {//该副作用函数已经被停止
      // 如果第一次执行 stop 后 active 就 false 了，这是为了防止重复的调用，执行 stop 逻辑
      cleanupEffect(this);//从所有依赖该副作用函数的响应式对象中移除该副作用函数，从而停止响应式追踪
      if (this.onStop) {//this.onStop 存在，则调用该回调函数，允许用户在副作用函数停止时执行自定义逻辑
        this.onStop();
      }
      this.active = false;//副作用函数已经停止
    }
  }
}
```

##### 触发get(访问)

##### 执行track(收集依赖)

##### 把effect收集起来作为依赖

### update 更新

#### 例：effect 单测

##### 触发set(修改)

```ts
it("should observe basic properties", () => {//验证 effect 函数是否能够观察到响应式对象的基本属性的变化
    let dummy;
    const counter = reactive({ num: 0 });
    effect(() => (dummy = counter.num));

    expect(dummy).toBe(0);
    counter.num = 7;// 更新时触发set操作
    expect(dummy).toBe(7);
});
```

##### 执行trigger(触发依赖)

baseHandlers.ts

```ts
function createSetter() {
	return function set(target, key, value, receiver) {
		const result = Reflect.set(target, key, value, receiver)

		trigger(target, 'set', key)// 触发trigger后重新运行effect函数

		return result
	}
}
```

##### effect重新运行

>执行fn->触发get(访问)->执行track(收集依赖)->把effect收集起来作为依赖

## baseHandlers | 脑图

![image-20250220164149032](C:\Users\DELL\AppData\Roaming\Typora\typora-user-images\image-20250220164149032.png)

直达src / baseHandlers.ts

### get

```ts
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    //这些辅助函数用于检查 key 是否为 ReactiveFlags.RAW，并且 receiver 是否与相应的映射表（reactiveMap、readonlyMap 或 shallowReadonlyMap）中的目标对象匹配。
    const isExistInReactiveMap = () =>
      key === ReactiveFlags.RAW && receiver === reactiveMap.get(target);

    const isExistInReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === readonlyMap.get(target);

    const isExistInShallowReadonlyMap = () =>
      key === ReactiveFlags.RAW && receiver === shallowReadonlyMap.get(target);

    if (key === ReactiveFlags.IS_REACTIVE) {//表示对象是否为响应式对象。
      return !isReadonly;
    } else if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly;
    } else if (//表示对象是否为只读对象。
      isExistInReactiveMap() ||
      isExistInReadonlyMap() ||
      isExistInShallowReadonlyMap()
    ) {
      return target;
    }

    //假设obj={foo:1} key:foo -> res = 1 res就是目标对象的属性值//
    const res = Reflect.get(target, key, receiver);

    if (!isReadonly) {//如果对象不是只读的，调用 track 函数进行依赖收集。只读对象不会被修改，也就不会触发 trigger 函数，所以不需要收集依赖。
      // 在触发 get 的时候进行依赖收集
      track(target, "get", key);//触发track
    }

    if (shallow) {//如果是浅响应式模式，直接返回属性值，不进行递归处理
      return res;
    }

    if (isObject(res)) {//如果属性值是一个对象，根据 isReadonly 的值，将其转换为只读响应式对象或普通响应式对象
      // res 等于 target[key]
      return isReadonly ? readonly(res) : reactive(res);
    }

    return res;
  };
}
```

### set

```ts
function createSetter() {
	return function set(target, key, value, receiver) {
         //假设obj={foo:1} key:foo -> value可变2//
         //obj={foo:2}//
		const result = Reflect.set(target, key, value, receiver)//设置对象的属性值

		trigger(target, 'set', key)//trigger函数会通知所有依赖该属性的副作用函数重新执行，以确保响应式系统能够正确更新相关的视图或数据。

		return result//设置完成，返回结果
	}
}
```

### deleteProperty



### has



### ownKeys



## track(收集依赖) | 脑图

![image-20250220212111915](C:\Users\DELL\AppData\Roaming\Typora\typora-user-images\image-20250220212111915.png)

### 初始化dep

src / effect.ts

```ts
export function track(target, type, key) {
    //target：响应式对象，即被代理的原始对象。
    //type：操作类型，例如 GET、SET 等，不过在当前代码中，type 参数未被使用。
    //key：响应式对象的属性名。
    if (!isTracking()) {//当前是否允许进行依赖收集
        return;
    }
    console.log(`触发 track -> target: ${target} type:${type} key:${key}`);
    
    let depsMap = targetMap.get(target);//targetMap 是一个 WeakMap，用于存储每个响应式对象对应的 depsMap
    if (!depsMap) {// 如果是第一次的话，初始化 depsMap 的逻辑
        depsMap = new Map();// 创建一个新的 Map 实例
        targetMap.set(target, depsMap);//存储到 targetMap 中
    }

    let dep = depsMap.get(key);//depsMap 是一个 Map，存储每个属性对应的 dep
    if (!dep) {
        dep = createDep();//创建一个新的 dep 实例
        depsMap.set(key, dep);//存储到 depsMap 中
    }

    trackEffects(dep);//将当前的副作用函数（activeEffect）添加到 dep 中，并将 dep 添加到 activeEffect 的 deps 数组中
}
```

### 基于activeEffect获取当前依赖 & dep.push(activeEffect)

```ts
export function trackEffects(dep) {
    // 将当前活跃的副作用函数（activeEffect）添加到对应的依赖集合（dep）中，同时将该依赖集合添加到副作用函数的依赖列表（deps）里。
    if (!dep.has(activeEffect)) {//检查是否已收集副函数
        dep.add(activeEffect);//添加
        (activeEffect as any).deps.push(dep);//添加依赖集合到副作用函数的依赖列表
    }
}
```

## trigger(触发依赖) | 脑图

src / effect.ts

```ts
export function trigger(target, type, key) {
    // target：响应式对象，即被代理的原始对象。
    // type：操作类型，例如 GET、SET 等。不过在当前代码中，暂时只处理了 GET 类型。
    // key：响应式对象的属性名。
    let deps: Array<any> = [];//存储所有依赖该属性的依赖集合（dep）

    const depsMap = targetMap.get(target);//从 targetMap 中获取 target 对应的 depsMap

    if (!depsMap) return;

    // 暂时只实现了 GET 类型
    // get 类型只需要取出来就可以
    const dep = depsMap.get(key);

    deps.push(dep);// 最后收集到 deps 内

    const effects: Array<any> = [];
    deps.forEach((dep) => { // 这里解构 dep 得到的是 dep 内部存储的 effect
        effects.push(...dep);
    });
    // 这里的目的是只有一个 dep ，这个dep 里面包含所有的 effect
    // 这里的目前应该是为了 triggerEffects 这个函数的复用
    triggerEffects(createDep(effects));// 触发该依赖集合中的所有副作用函数重新执行
}
```

src / dep.ts

```ts
export function createDep(effects?) {
    // Set 是 JavaScript 中的一种数据结构，类似于数组，但成员的值都是唯一的，没有重复的值。
    const dep = new Set(effects);// 将传入的 effects 作为初始值填充到这个 Set 中
    return dep;
}
```

src / effect.ts

```ts
export function triggerEffects(dep) { // dep 是一个存储副作用函数的集合，通常是一个 Set 类型，用于记录依赖于某个响应式对象属性的所有副作用函数。
    for (const effect of dep) {// 遍历 dep 集合中的每个副作用函数 effect
        if (effect.scheduler) {// effect.scheduler存在
            // scheduler 可以让用户自己选择调用的时机，这样就可以灵活的控制调用了
            // 在 runtime-core 中，就是使用了 scheduler 实现了在 next ticker 中调用的逻辑
            effect.scheduler();
        } else {
            effect.run();// 直接调用 effect.run() 方法，执行副作用函数。
        }
    }
}
```

# runtime-core 初始化核心

## Demo

example / helloWorld

index.html

```html
<div id="root"></div>
<script src="main.js" type="module"></script>
```

main.js

```js
import { createApp } from "../../dist/mini-vue.esm-bundler.js";
import App from "./App.js";

const rootContainer = document.querySelector("#root");//获取根标签节点
createApp(App).mount(rootContainer); //createApp(传入根组件).mount(传入根容器)
```

App.js

```js
export default {//一个对象
    name: "App",//标记当前组件的名字
    setup(props,context) {},//一个在组件创建之前执行的函数，可使用响应式数据、生命周期钩子、计算属性等

    render() {//把template转化成render函数，代表这个组件想要渲染出来的视图
        //tag标签名(div)  props属性对象  children数据包含了(div 元素的子节点)
        return h("div", { tId: 1 }, [h("p", {}, "主页"), h(HelloWorld)]);
    },
};
```

## 渲染流程详解

### mount 初始化流程

> ![138114565-3e0eecbb-7fd0-4203-bf36-5e5fd8003ce0](C:\Users\DELL\Desktop\138114565-3e0eecbb-7fd0-4203-bf36-5e5fd8003ce0.png)
>
> 先进入main.js---获取到根容器---触发createApp函数---调用createApp内部App对象的mount函数---mount内部基于传来的根容器生成虚拟节点vnode(一个普通对象但有几个关键的key，最关键的是有type对象[和传入的对象是一样的name|setup|render])
>
> 调用mount内部的render---调用内部patch方法---解构出type对象---switch判断type的类型从而用不同的方法处理
>
> >**component** 组件类型---调用processComponent---根据!n1分成初始化or更新
> >
> >>**mountComponent** 初始化---模板初始化对象+把vnode虚拟节点挂在到该对象上---***setupComponent***---initProps+initSlots+setupStatefulComponent初始化props/slots/setup&处理组件---在setupStatefulComponent创建一个代理对象[还是那个传来的type对象]将其绑定到instance对象上---传入instance触发setcurrentinstance---handlesetupResult基于setup中的props和context做出一定的处理---1.setup返回一个函数[会把它当成render函数去写] 2.setup返回一个对象[赋值,调用finishComponentSetup,如果没有render会将Component的render赋值给它]
> >>
> >>往回走走到***setupComponent***，instance.update使用effect调用componentUpdateFn---该函数中要调用传来对象里的render函数获取vnode子组件生成好的虚拟节点---在componentUpdateFn触发***patch***(递归回去了)【!此时已经变成**element**元素类型了!】
> >
> >>**updateComponent** 更新
>
> >**element** 元素类型---调用processElement---根据!n1分成初始化or更新
> >
> >>**mountElement** 初始化(把虚拟节点转化成一个真实的dom元素)---创建el(真实的element)---[文本类型调用hostcreateElement]---[数组类型调用mountChildren]传入childer节点,el---遍历数组触发***patch***(递归)【!此时数组元素就是**element**类型!】
> >>
> >>仍然位于mountElement函数中,如果元素props存在,遍历调用**hostPatchProp**(传入el,key,null,val)---分类,内部处理还是调用了dom内部的API
> >>
> >>返回mountElement函数,下一步调用**hostInsert**(el,container[根组件])[将所有的一切插回#root根元素组件]到此所有元素就都在页面上展示出来了，也就是初始化的全过程
> >
> >>**updateElement** 更新

> 通俗来说：***调用render就是“拆箱”的过程***直到把内部所有的组件渲染到浏览器上

### update 更新流程

App.js 样例变动

```js
export default {//一个对象
    name: "App",//标记当前组件的名字
    setup(props,context) {//一个在组件创建之前执行的函数，可使用响应式数据、生命周期钩子、计算属性等
        const count = ref(10)
        window.count = count
        
        return{
            count,
        };
    },

    render() {//把template转化成render函数，代表这个组件想要渲染出来的视图
        //tag标签名(div)  props属性对象  children数据包含了(div 元素的子节点)
        return h("div", { tId: 1 }, [h("p", {}, "主页" + this.count)]);
    },
};
```

> ![138115157-1f4fb8a2-7e60-412d-96de-12e68eb0288c](C:\Users\DELL\Desktop\138115157-1f4fb8a2-7e60-412d-96de-12e68eb0288c.png)
>
> 响应式的值发生改变(响应式对象都在render函数内)---执行用户传入的fn---判断是否初始化---触发当前组件的effect函数执行(instance,update)---调用render函数(获取前后虚拟节点树节点)---触发***patch***(前后虚拟节点树节点)---根据!n2分成**component**组件类型or**element**元素类型
>
> 更新逻辑：***processXXX***中n1存在---进入***updateXXX***(n1,n2)---取出新(n1&n2)老(n2&{})props---n2.el=n1.el---对比props(patchProps)---对比children(patchChild)双端对比算法实现

# 逐步搭建

## 初始化项目+搭建环境

```js
npm init -y
npm install --save-dev jest
pnpm add typescript --save-dev
npx tsc --init
pnpm add --save-dev jest
pnpm i --save-dev @types/node
```

替换 package.json & tsconfig.json

```json
"scripts": {
    "test": "jest"
}

"types": ["jest"],
"noImplicitAny": false,//把any报错忽略掉
```

配置bable环境

```
pnpm add --save-dev babel-jest @babel/core @babel/preset-env @babel/preset-typescript
```

根目录下创建一个`babel.config.js`文件

> 以当前node版本做一个转换 | 支持TS

```javascript
module.exports = {
  presets: [
    ['@babel/preset-env', {targets: {node: 'current'}}],
    '@babel/preset-typescript',
  ],
};
```

编写测试文件

reactivity / index.ts

```ts
export function sum(a, b) {
	return a + b
}
```

reactivity / tests / index.spec.ts

```ts
it('index', () => {
	expect(1).toBe(1)
})
```

单测运行

```
pnpm test
```

