# mini-vue搭建笔记

# 原理概况

```
https://github.com/cuixiaorui/mini-vue
```

## Vue3模块组织方式

### 流程图

<img src="C:\Users\DELL\AppData\Roaming\Typora\typora-user-images\image-20250219223855962.png" alt="image-20250219223855962" style="zoom:50%;" />

### 简单来说

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

### 更为详细的

#### runtime-reactivity 响应式系统

>提供了诸如 reactive、ref 等 API 来创建响应式对象或变量。
>使用 WeakMap 数据结构来跟踪依赖关系，确保当数据变化时能够通知相关的观察者进行更新。
>实现了 effect 函数机制，用于自动追踪和触发副作用函数的执行。

#### runtime-core 跨平台渲染

>Vue3 的运行时核心模块，提供了跨平台的渲染能力。它的主要职责包括：
>定义了通用的渲染器接口 createRenderer，允许开发者自定义渲染逻辑。
>实现了组件生命周期管理、插槽机制以及其他运行时所需的基础功能。
>提供了诸如 h 函数这样的工具，用于创建虚拟 DOM 节点。
>包含了与平台无关的运行时核心实现（如虚拟 DOM 的渲染器、组件实现和一些全局的 JS API）。

#### runtime-dom DOM方法

>runtime-dom 模块针对浏览器环境实现了具体的运行时逻辑。其主要任务是：
>封装了一系列与 DOM 操作相关的实用方法，如创建元素、插入节点等。
>提供了一个基于 runtime-core 的默认渲染器实例，用于将虚拟 DOM 节点渲染到真实的 DOM 容器中。
>处理特定于浏览器的行为，比如属性绑定、事件监听器添加等。
>对原生 DOM API、属性、样式、事件等进行管理。

#### compiler-sfc 解析.vue组件

>compiler-sfc 模块负责解析单文件组件（.vue 文件），它将 .vue 文件中的 <template>、<script> 和 <style> 部分分别提取出来，并对它们进行相应的处理。具体而言：
>对于 <template> 部分，会调用 compiler-dom 来将其编译为渲染函数。
>对于 <script> 部分，可能会做一些额外的处理，比如注入上下文或处理 TypeScript 类型声明。
>对于 <style> 部分，则可能涉及 CSS 模块化处理或者其他样式相关的转换。

#### compiler-core 编译逻辑和算法

>作为 Vue 编译的核心模块，compiler-core 是平台无关的，提供了基础的编译逻辑和算法。它的职责是定义了编译的基本流程，包括但不限于：
>提供 baseParse 函数用于解析模板字符串到 AST。
>定义了 transform 方法来对 AST 进行转换。
>实现了 generate 函数用来从 AST 生成最终的渲染函数代码。
>提供了与平台无关的代码转换插件，适用于不同类型的编译需求。

#### compiler-dom 浏览器模板编译

>该模块专注于浏览器端的模板编译工作。它的主要功能包括：
>接收 Vue 的模板字符串作为输入，通过调用 baseCompile 函数来执行实际的编译过程。
>将模板字符串解析为抽象语法树（AST）。
>对 AST 进行必要的转换和优化。
>最终生成可执行的 JavaScript 渲染函数代码，以便在浏览器环境中运行。

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
>     get(target, key, receiver) {
>          console.log(`Getting ${key}`);
>          return Reflect.get(target, key, receiver);
>     },
>     set(target, key, value, receiver) {
>          console.log(`Setting ${key} to ${value}`);
>          const result = Reflect.set(target, key, value, receiver);
>          if (result) {
>                console.log("Trigger updates...");
>          }
>          return result;
>     }
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
> console.log(`Count is ${state.count}`);
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
> console.log(`Count is ${state.count}`);
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
> >
> >>往回走走到***setupComponent***，instance.update使用effect调用componentUpdateFn---该函数中要调用传来对象里的render函数获取vnode子组件生成好的虚拟节点---在componentUpdateFn触发***patch***(递归回去了)【!此时已经变成**element**元素类型了!】
> >
> >>**updateComponent** 更新
>
> >**element** 元素类型---调用processElement---根据!n1分成初始化or更新
> >
> >>**mountElement** 初始化(把虚拟节点转化成一个真实的dom元素)---创建el(真实的element)---[文本类型调用hostcreateElement]---[数组类型调用mountChildren]传入childer节点,el---遍历数组触发***patch***(递归)【!此时数组元素就是**element**类型!】
> >
> >>仍然位于mountElement函数中,如果元素props存在,遍历调用**hostPatchProp**(传入el,key,null,val)---分类,内部处理还是调用了dom内部的API
> >
> >>返回mountElement函数,下一步调用**hostInsert**(el,container[根组件])[将所有的一切插回#root根元素组件]到此所有元素就都在页面上展示出来了，也就是初始化的全过程
> >
> >>**patchElement** 

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



## runtime-reactivity 响应式系统实现

### 编写单测

#### effect

reactivity / texts / effect.spec.ts

```ts
import { effect } from '../effect'
import { reactive } from '../reactive'

describe('effect', () => {
	it.skip('effect', () => {
		const user = reactive({// 响应式对象
			age: 10,
		})

		let nextAge
		effect(() => {//收集依赖 接收fn 触发get操作
			nextAge = user.age + 1
		})

		expect(nextAge).toBe(11)

		// update 触发set操作
		user.age++
		expect(nextAge).toBe(12)
	})
})
```

#### reactive

reactivity / texts / reactive.spec.ts

```ts
import { reactive } from '../reactive'

describe('reactive', () => {
    it('reactive', () => {
        const original = { age: 1 }
        const observed = reactive(original)
        expect(observed).not.toBe(original)
        expect(observed.age).toBe(1)
    })
})
```



### 实现reactive

tsconfig.json

```json
"lib": ["DOM","ES6"], 
```

reactivity / reactive.ts

> 传入一个对象，返回一个Proxy对象，实现 get & set 函数
>
> > 详解 假设对象为 { foo : 1 }
> >
> > ```ts
> > target: { foo : 1 }
> > key: foo
> > value: 1
> > ```

```ts
export function reactive(raw) {
    return new Proxy(raw, {
        get(target, key) {
            const res = Reflect.get(target, key)

            // TODO:收集依赖

            return res
        },
        
        set(target, key, value) {
            const res = Reflect.set(target, key, value)
            
            // TODO:触发依赖

            return res
        }
    })
}
```

> 测试 pnpm test reactive

### 实现effect

reactivity / effect.ts

> 传入一个副作用函数fn，响应式数据发生变化时，重新执行fn
>
> > 封装类，将 `_fn` 私有属性和 `run` 方法封装在一起，外部代码只能通过 `run` 方法来执行 `_fn`，隐藏内部实现细节，提高代码的安全性和可维护性
> >
> > ```ts
> > class ReactiveEffect {
> >  private _fn: any
> > 	constructor(fn) {
> > 		this._fn = fn
> > 	}
> > 	run() {
> > 		this._fn()
> > 	}
> > }
> > ```

```ts
export function effect(fn) {
	const _effect = new ReactiveEffect(fn)

	_effect.run()
}
```

> 测试 pnpm test effect

### 实现reactive-get

```ts
get(target, key) {
    const res = Reflect.get(target, key)

    track(target, key) //传入对象和key

    return res
},
```

#### track 依赖收集

reactivity / effect.ts

> 构建一个容器，存储依赖
>
> ```ts
> const targetMap = new Map() // 存储依赖关系
> ```

```ts
const targetMap = new Map() // 存所有依赖
export function track(target, key) {
	let depsMap = targetMap.get(target)
	if (!depsMap) {
		depsMap = new Map()
		targetMap.set(target, depsMap)//targetMap结构[target<obj>, depsMap<map>]
	}

	let dep = depsMap.get(key)
	if (!dep) {
		dep = new Set()
		depsMap.set(key, dep)//depsMap结构[key<key>, dep<ReactiveEffect>]
	}

	dep.add(？)
}
```

如何拿到fn

```ts
//全局对象
let activeEffect

//ReactiveEffect类内
run() {
    activeEffect = this
    this._fn()
}

//传入effect
dep.add(activeEffect)
```

### 实现reactive-set

```ts
set(target, key, value) {
    const res = Reflect.set(target, key, value)

    trigger(target, key) //传入对象和key
    
    return res
}
```

#### trigger 依赖触发

reactivity / effect.ts

```ts
export function trigger(target, key) {
	let depsMap = targetMap.get(target)
	if (!depsMap) {
		return
	}

	let dep = depsMap.get(key)
	if (!dep) {
		return
	}

	dep.forEach((effect) => {
        effect.run()
    })
}
```

> 测试 pnpm test effect

### 完善effect功能

#### 功能单测1

reactivity / texts / effect.spec.ts

```ts
it('返回runner可以触发effect', () => {
    let foo = 10
    const runner = effect(() => {
        foo++
        return foo
    })

    expect(foo).toBe(11)//创建effect - foo++
    const r = runner()//调用runner - foo++
    expect(foo).toBe(12)
    expect(r).toBe(foo)//调用runner - foo++
})
```

修改effect逻辑

*实现创建实例时run一次*

```ts
export function effect(fn) {
	const _effect = new ReactiveEffect(fn)

	_effect.run() //先执行一次

    return _effect.run.bind(_effect)//返回run函数并绑定this
}
```

```ts
run() {
    activeEffect = this
    return this._fn()//返回值
}
```

> Tips：有关 ***.bind(...)***
>
> 直接返回 `_effect.run` 会让 `run` 方法在调用时 `this` 指向出现问题，可能导致 `this._fn()` 无法正常执行。
>
> *例子*
>
> ```ts
> class ReactiveEffect {
>  private _fn: any;
>  constructor(fn) {
>      this._fn = fn;
>  }
>  run() {
>      console.log('this:', this);
>      this._fn();
>  }
> }
> 
> function effectWithBind(fn) {// 返回 _effect.run.bind(_effect)
>  const _effect = new ReactiveEffect(fn);
>  _effect.run();
>  return _effect.run.bind(_effect);
> }
> 
> function effectWithoutBind(fn) {// 返回 _effect.run
>  const _effect = new ReactiveEffect(fn);
>  _effect.run();
>  return _effect.run;
> }
> 
> const boundRun = effectWithBind(f);// 使用 effectWithBind
> boundRun(); // this 指向 _effect 实例
> 
> const unboundRun = effectWithoutBind(f);// 使用 effectWithoutBind
> unboundRun(); // this 指向全局对象（在浏览器中是 window）
> ```

> 测试 pnpm test effect

#### 功能单测2

reactivity / texts / effect.spec.ts

```ts
it.skip("scheduler", () => {
    // 1. 通过 effect 的第二个参数给定一个 scheduler 的 fn
    // 2. effect 第一次执行的时候 还会执行 fn
    // 3. 当 响应式对象 set update 不会执行 fn 而是执行 scheduler
    // 4. 如果说当执行 runner 的时候 会再次执行 fn
    let dummy
    let run: any
    const scheduler = jest.fn(() => {
        run = runner
    })
    const obj = reactive({ foo: 1 })
    const runner = effect(() => 
		{ dummy = obj.foo },
		{ scheduler }
    )

    expect(scheduler).not.toHaveBeenCalled()//scheduler不会被调用
    expect(dummy).toBe(1)

    //当响应式对象set时调用scheduler,但不会执行fn
    obj.foo++
    expect(scheduler).toHaveBeenCalledTimes(1)
    expect(dummy).toBe(1)

    //调用runner时执行fn
    run()
    expect(dummy).toBe(2)
})
```

更新effect函数

```ts
constructor(fn, public scheduler?) {//拿到可选参数scheduler
    this._fn = fn
}

export function effect(fn, options: any = {}) {
    const scheduler = options.scheduler//拿到scheduler
    const _effect = new ReactiveEffect(fn, scheduler)//给类传入scheduler

    _effect.run()
    return _effect.run.bind(_effect)
}
```

修改更新函数trigger逻辑

```ts
dep.forEach((effect) => {
    if (effect.scheduler) {
        effect.scheduler()
        return
    } else {
        effect.run()
    }
    effect.run()
})
```

> pnpm test effect

#### 功能单测3

reactivity / texts / effect.spec.ts

```ts
it("stop的执行逻辑", () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
        dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)

    stop(runner)//停止执行runner

    obj.prop = 3
    expect(dummy).toBe(2)

    runner()
    expect(dummy).toBe(3)
})
```

reactivity / effect.ts

实现stop代码

```ts
export function stop(runner) {
	runner.effect.stop()
}
```

修改effect函数

```ts
export function effect(fn, options: any = {}) {
    const scheduler = options.scheduler
    const _effect = new ReactiveEffect(fn, scheduler)
    
    _effect.run()
    
    const runner: any = _effect.run.bind(_effect) //定义runner函数并绑定this
    runner.effect = _effect //将effect挂载到runner上

    return runner
}
```

track（依赖收集）函数添加逻辑

```ts
dep.add(activeEffect)
activeEffect.deps.push(dep)
```

修改effect类 | 添加stop函数

```ts
public deps = []

stop() {
    this.deps.forEach((dep:any) => {
        dep.delete(this)
    })
}
```

> pnpm test effect --watch

代码优化（抽离清除逻辑 & 防抖）

```ts
active = true

stop() {
    if (this.active) {
        cleanupEffect(this)	
        this.active = false
    }
}

function cleanupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
}
```

#### 功能单测4

reactivity / texts / effect.spec.ts

```ts
it('onStop的执行逻辑', () => {
    const obj = reactive({
        foo: 1,
    })
    const onStop = jest.fn()//jest.fn() 创建一个模拟函数 onStop，用于记录其调用次数和参数
    let dummy
    const runner = effect(
        () => {
            dummy = obj.foo//响应式对象
        },
        {
            onStop,//选项对象
        }
    )
    stop(runner)
    expect(onStop).toBeCalledTimes(1)//验证 onStop 函数是否被调用了一次
})
```

reactivity / effect.ts

```ts
//_effect.onStop = options.onStop//调用类方法
//Object.assign(_effect, options)//调用类方法(优化)
extend(_effect, options)//调用类方法(抽离封装)
```

> Tip：二者区别
>
> ```ts
> // 假设 options 对象如下
> const options = {
>  onStop: () => console.log('Effect stopped'),
>  someOtherOption: 'value'
> };
> const _effect = new ReactiveEffect(() => {});
> ```
>
> ```ts
> // 仅赋值 onStop 属性
> _effect.onStop = options.onStop;
> 
> console.log(_effect.onStop); // 输出: () => console.log('Effect stopped')
> console.log(_effect.someOtherOption); // 输出: undefined
> ```
>
> ```ts
> // 复制 options 对象的所有属性到 _effect
> Object.assign(_effect, options);
> 
> console.log(_effect.onStop); // 输出: () => console.log('Effect stopped')
> console.log(_effect.someOtherOption); // 输出: 'value'
> ```

继续抽离函数

src / shared (放置通用的工具函数) / index.ts

```ts
export const extend = Object.assign
```

修改类

```ts
onStop?: () => void

stop() {
    if (this.active) {
        cleanupEffect(this)
        if (this.onStop) {
            this.onStop()	
        }
        this.active = false
    }
}
```

### 实现readonly功能

#### 编写单测

readonly.spec.ts

> 只读属性只能读取set不能被改写set

```ts
import { readonly } from '../reactive'

describe('readonly', () => {
	it('readonly', () => {
		const original = { foo: 1 }
		const wrapped = readonly(original)
		expect(wrapped).not.toBe(original) //返回一个新对象，而非返回原对象
		expect(wrapped.foo).toBe(1)
	})

	it('warning when call set', () => {
		console.warn = jest.fn()
		const user = readonly({
			age: 10,
		})
		user.age = 11
		expect(console.warn).toBeCalled()//调用了console.warn
	})
})
```

reactive

```ts
export function readonly(raw) {
    return new Proxy(raw, {
        get(target, key) {
            return Reflect.get(target, key)
        },
        set(target, key, value) {
            console.warn(`key: ${key} set 失败，因为 target 是 readonly 的`, target)
            return true
        }
    }) 
}
```

抽离 get & set 函数

createGetter

```ts
function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {//返回一个get函数
        const res = Reflect.get(target, key)
        if (!isReadonly) {
            track(target, key)
        }
        if (shallow) {
            return res
        }
        if (typeof res === 'object') {
            return isReadonly ? readonly(res) : reactive(res)
        }
        return res
    }
}
```

createSetter

```ts
function createSetter(shallow = false) {
	return function set(target, key, value) {
		const res = Reflect.set(target, key, value)
		trigger(target, key)
		return res
	}
}
```

改写函数

```ts
export function reactive(raw) {
	return new Proxy(raw, {
		get: createGetter(),
		set: createSetter(),
	})
}

export function readonly(raw) {
	return new Proxy(raw, {
		get: createGetter(true),
		set(target, key, value) {
			console.warn(`key: ${key} set 失败，因为 target 是 readonly 的`, target)
			return true
		},
	})
}
```

继续优化抽离组件

创建 baseHanders.ts | 封装get逻辑

```ts
import { track, trigger } from './effect'

function createGetter(isReadonly = false) {
	return function get(target, key) {
		const res = Reflect.get(target, key)
		if (!isReadonly) {
			track(target, key)
		}
		return res
	}
}

function createSetter() {
	return function set(target, key, value) {
		const res = Reflect.set(target, key, value)
		trigger(target, key)
		return res
	}
}

export const reactiveHandlers = {
	get: createGetter(),
	set: createSetter(),
}

export const readonlyHandlers = {
	get: createGetter(true),
	set(target, key, value) {
		console.warn(`key: ${key} set 失败，因为 target 是 readonly 的`, target)
		return true
	},
}
```

重构 reactive & readonly

```ts
import { reactiveHandlers, readonlyHandlers } from './baseHanders'

function createActiveEffect(raw: any, baseHanders) {
	return new Proxy(raw, baseHanders)
}

export function reactive(raw) {
	return createActiveEffect(raw, reactiveHandlers)
}

export function readonly(raw) {
	return createActiveEffect(raw, readonlyHandlers)
}
```

为 createGetter 添加缓存机制

```ts
const get = createGetter()
const set = createSetter()
const readonlyGet = createGetter(true)
```

> pnpm test readonly --watch

### 实现 isReactive & isReadonly 功能

#### 编写单测

reactive.spec.ts

> 判断传入的 `value` 是否为响应式对象

```ts
it('reactive', () => {
    const original = { age: 1 }
    const observed = reactive(original)
    expect(observed).not.toBe(original)
    expect(observed.age).toBe(1)

    //判断是否是响应式对象
    expect(isReactive(observed)).toBe(true)
    expect(isReactive(original)).toBe(false)
})
```

readonly.spec.ts

> 判断是否是只读对象

```ts
it('readonly', () => {
    const original = { foo: 1 }
    const wrapped = readonly(original)
    expect(wrapped).not.toBe(original) //返回一个新对象，而非返回原对象
    expect(wrapped.foo).toBe(1)

    expect(isReadonly(wrapped)).toBe(true)//判断是否是只读对象
})
```

#### 功能实现

createGetter拦截判断

```ts
function createGetter(isReadonly = false) {
	return function get(target, key) {

		if (key === ReactiveFlags.IS_REACTIVE) {//判断是否是响应式对象
			return !isReadonly
		}else if (key === ReactiveFlags.IS_READONLY) {//判断是否是只读对象
			return isReadonly
		}

		const res = Reflect.get(target, key)
		if (!isReadonly) {
			track(target, key)
		}
		return res
	}
}
```

reactive.ts

```ts
export const enum ReactiveFlags {
	IS_REACTIVE = '__v_isReactive',
	IS_READONLY = '__v_isReadonly',
}

export function isReactive(value) {//判断是否是响应式对象
    return !!value[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(value) {//判断是否是只读对象
    return !!value[ReactiveFlags.IS_READONLY]
}
```

> pnpm test readonly --watch
>
> pnpm test reactive --watch

### stop功能优化

#### 当前bug

```ts
it("stop的执行逻辑", () => {
    let dummy
    const obj = reactive({ prop: 1 })
    const runner = effect(() => {
        dummy = obj.prop
    })
    obj.prop = 2
    expect(dummy).toBe(2)

    stop(runner)//停止执行runner

    // obj.prop = 3 只涉及set操作
    obj.prop++ //触发 get+set
    
    expect(dummy).toBe(2)

    runner()
    expect(dummy).toBe(3)
})
```

> stop(runner)会根据该响应式对象中active的状态清除它的已经收集的所有依赖
>
> ```ts
> effect.deps.forEach((dep: any) => {
>     dep.delete(effect)
> })
> ```
>
> +1触发get操作一定会触发track操作重新收集依赖 
>
> ```ts
> dep.add(activeEffect)//之前的依赖都白清了
> ```
>
> 所以stop函数之后的操作不应该收集依赖（不能触发track操作）

#### 代码实现

track添加逻辑

```ts
if(!activeEffect || !shouldTrack){//如果没有激活的effect或者shouldTrack为false，直接返回
    return	
}

//...收集依赖

if (dep.has(activeEffect)) {
    return
}
dep.add(activeEffect)
activeEffect.deps.push(dep)
```

修改run函数（stop根据active状态区分）

```ts
run() {
    if (!this.active) { // stop状态直接返回fn
        return this._fn()
    }

    shouldTrack = true // 允许进行依赖收集
    activeEffect = this

    const res = this._fn() // this._fn() 执行，期间访问响应式对象的属性，触发track依赖收集

    shouldTrack = false // 依赖收集结束，后续操作不会再触发依赖收集。

    return res
}
```

cleanupEffect添加逻辑

```ts
effect.deps.length = 0
```

> pnpm test reactive --watch

### 嵌套响应式转换

#### 编写单测

reactive

```ts
it('嵌套响应式对象转换', () => {
    const original = {
        nested: {
            foo: 1
        },
        array: [{ bar: 2 }]
    }
    const observed = reactive(original)
    expect(isReactive(observed.nested)).toBe(true)
    expect(isReactive(observed.array)).toBe(true)
    expect(isReactive(observed.array[0])).toBe(true) 
})
```

readonly

```ts
it('readonly', () => {
    const original = { foo: 1, bar: { baz: 2 } }
    const wrapped = readonly(original)

    expect(wrapped).not.toBe(original) //返回一个新对象，而非返回原对象
    expect(wrapped.foo).toBe(1)

    expect(isReadonly(original)).toBe(false)
    expect(isReadonly(original.bar)).toBe(false)
    expect(isReadonly(wrapped)).toBe(true)//只读
    expect(isReadonly(wrapped.bar)).toBe(true)//只读
})
```

baseHanders.ts 递归拦截

> createGetter函数
>
> const res = Reflect.get(*target*, *key*)后添加判断

```ts
if (isObject(res)) {//判断是否是对象
    return isReadonly ? readonly(res) : reactive(res)//返回只读对象或者响应式对象
}
```

shared / index.ts

```ts
export const isObject = (val) => {
	return val !== null && typeof val === 'object'
}
```

### shallowReadonly工具函数

#### 编写单测

shallowReadonly.spec.ts

> 数据展示:确保外层数据不会被意外修改，同时允许在必要时修改嵌套对象
>
> 性能优化:避免对所有嵌套对象进行只读处理

```ts
import { isReadonly, shallowReadonly } from '../reactive'

describe('shallowReadonly', () => {
    it('shallowReadonly', () => {
        const props = shallowReadonly({ n: { foo: 1 } })
        expect(isReadonly(props)).toBe(true)//表层只读
        expect(isReadonly(props.n)).toBe(false)//内部正常
    })
})
```

#### 功能实现

reactive.ts

```ts
export function shallowReadonly(raw) {
    return createActiveEffect(raw, shallowReadonlyHandlers)
}
```

baseHanders.ts

```ts
const readonlyGet = createGetter(true)
const shallowReadonlyGet = createGetter(true, true)
```

createGetter改写

```ts
function createGetter(isReadonly = false, shallow = false)

if (shallow) {
    return res	
}
//👇判断isObject前拦截👆//
if (isObject(res)) {//判断是否是对象
    return isReadonly ? readonly(res) : reactive(res) //返回只读对象或者响应式对象
}
```

继承改写自readonlyHandlers

```ts
export const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
})
```

### 实现isProxy功能

#### 编写单测

> 判断是否是代理对象

reactive & readonly 分别添加

```ts
expect(isProxy(observed)).toBe(true)
```

```ts
expect(isProxy(wrapped)).toBe(true)
```

#### 功能实现

```ts
export function isProxy(value) { //判断是否是代理对象
	return isReactive(value) || isReadonly(value)	
}
```

### 实现ref

#### 必看：`ref`与`reactive`区别

| **reactive**                                | **ref**                                                      |
| ------------------------------------------- | ------------------------------------------------------------ |
| ❌只支持**对象**和**数组**(引用数据类型)     | ✅支持基本数据类型+引用数据类型                               |
| ❌重新分配一个新对象会丢失响应性             | ✅重新分配一个新对象**不会**失去响应                          |
| ❌将对象传入函数时,失去响应                  | ✅传入函数时,不会失去响应                                     |
| 能直接访问属性                              | 需要使用 `.value` 访问属性                                   |
| ✅在 `<script>` 和 `<template>` 中无差别使用 | ❌在 `<script>` 和 `<template>` 使用方式不同(script中要`.value`) |
| ❌解构时会丢失响应性,需使用toRefs            | ❌解构对象时会丢失响应性,需使用toRefs                         |

> ref只传单值，不能使用Proxy(Proxy对对象起作用)
>
> ref中的任何一个点key都要对应一个dep，get&set进行依赖收集和触发

#### 功能单测1

```ts
import { effect } from '../effect'
import { ref } from '../ref'

describe('ref', () => {
    it.only('value', () => {
        const a = ref(1)
        expect(a.value).toBe(1)
    })
})
```

ref.ts

```ts
class RefImpl {
    private _value: any;
    constructor(value) {//构造函数
        this._value = value;
    }

    get value() {//获取value
        return this._value;
    }

    // set value() {

    // }
}

export function ref(value) {
    return new RefImpl(value);
}
```

#### 功能单测2

```ts
it('should be reactive', () => {
    const a = ref(1)
    let dummy
    let calls = 0
    effect(() => {
        calls++
        dummy = a.value
    })
    expect(calls).toBe(1)//effect执行了一次
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // 值相同不会触发
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
})
```

ref.ts

```ts
class RefImpl {
    private _value: any //值
    public dep //依赖就是唯一的value
    constructor(value) {
        //构造函数
        this._value = value //存储值
        this.dep = new Set() //存储依赖
    }

    get value() {
        //获取value
        return this._value
    }

    set value(newValue) {}
}

export function ref(value) {
    return new RefImpl(value)
}
```

回到effect抽离 get & set 逻辑代码复用

```ts
	trackEffects(dep)
}

export function trackEffects(dep) {
    if (dep.has(activeEffect)) {
        return
    }
    dep.add(activeEffect)
    activeEffect.deps.push(dep)
}

......

	triggerEffects(dep)
}

export function triggerEffects(dep) { 
	dep.forEach((effect) => {
		if (effect.scheduler) {
			effect.scheduler()
			return
		} else {
			effect.run()
		}
	})
}
```

ref.ts

```ts
get value() {
    trackEffects(this.dep) //收集依赖
    return this._value //获取value
}

set value(newValue) {
    this._value = newValue //设置value
    triggerEffects(this.dep) //触发依赖
}
```

实现赋值相同不触发effect功能

set value添加

```ts
if(Object.is(newValue,this._value)) return //如果新值和旧值相等，直接返回
```

抽离封装成工具函数

```ts
function trackRefValue(ref) {
	if (isTracking()) {
		trackEffects(ref.dep)
	}
}
```

```ts
export const hasChange = (val, newValue) => {
	return !Object.is(val, newValue)
}
```

get & set value改写

```ts
get value() {
    trackRefValue(this) //收集依赖
    return this._value //获取value
}
```

```ts
set value(newValue) {
    if (hasChange(newValue, this._value)) {//判断是否有变化
        this._value = newValue //设置value
        triggerEffects(this.dep) //触发依赖
    }
}
```

#### 功能单测3

```ts
it('嵌套响应', () => {
    const a = ref({
        count: 1,
    })
    let dummy
    effect(() => {
        dummy = a.value.count
    })
    expect(dummy).toBe(1)
    a.value.count = 2
    expect(dummy).toBe(2)
})
```

> 要实现嵌套就设计递归嘛

```ts
private _value: any //值
public dep //依赖就是唯一的value
private _rawValue: any //原始值
constructor(value) {
    this._rawValue = value
    this._value = isObject(value) ? reactive(value) : value //如果是对象，就递归
    this.dep = new Set() //存储依赖
}

set value(newValue) {
    if (hasChange(newValue, this._rawValue)) {
        //判断是否有变化
        this._rawValue = newValue
        this._value = isObject(newValue) ? reactive(newValue) : newValue
        triggerEffects(this.dep) //触发依赖
    }
}
```

继续优化

```ts
private _rawValue: any //原始值

set value(newValue) {
    if (hasChange(newValue, this._rawValue)) {
        //判断是否有变化
        this._rawValue = newValue
        this._value = convert(newValue) //如果是对象，就递归
        triggerEffects(this.dep) //触发依赖
    }
}

function convert(value) {
    return isObject(value) ? reactive(value) : value	
}
```

### 实现isRef

#### 编写单测

```ts
it('isRef', () => {
    const a = ref(1)
    const user = {
        age: a,
    }
    expect(isRef(a)).toBe(true)
    expect(isRef(1)).toBe(false)
    expect(isRef(user)).toBe(false)
})
```

#### 功能实现

```ts
public __v_isRef = true //标识是否是ref

export function isRef(ref) {
	return !!ref.__v_isRef//转换为布尔值
}
```

### 实现unRef

>如果参数是 ref，则返回内部值，否则返回参数本身

#### 编写单测

```ts
it('unRef', () => {//
    const a = ref(1)
    expect(unRef(a)).toBe(1)
    expect(unRef(1)).toBe(1)
})
```

#### 功能实现

```ts
export function unRef(ref) {
    return isRef(ref) ? ref.value : ref //如果是ref，就返回value，否则返回原对象	
}
```

### 实现proxyRefs (?)

#### 编写单测

```ts
it('proxyRefs', () => {
    const user = {
        age: ref(10),
        name: 'zf',
    }
    const proxyUser = proxyRefs(user)
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)//可以省略.value
    expect(proxyUser.name).toBe('zf')//可以省略.value

    proxyUser.age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    proxyUser.age = ref(10)
    expect(proxyUser.age).toBe(10)
    expect(user.age.value).toBe(10)
})
```

#### 功能实现

> 逻辑：
>
> get到ref返回.value，否则直接返回原对象
>
> 实例对象触发set会连锁原对象值改变

```ts
export function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key)) //如果是ref，就返回value，否则返回原对象
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value)) {
                return (target[key].value = value) //如果是ref，就返回value，否则返回原对象
            } else {
                return Reflect.set(target, key, value) //如果是ref，就返回value，否则返回原对象
            }
        },
    })
}
```

### 实现computed

> 接受一个 [getter 函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/get#description)，返回一个只读的响应式 [ref](https://cn.vuejs.org/api/reactivity-core.html#ref) 对象。该 ref 通过 `.value` 暴露 getter 函数的返回值。它也可以接受一个带有 `get` 和 `set` 函数的对象来创建一个可写的 ref 对象。

#### 功能单测1

computed.spec.ts

> `computed` 函数会基于这个 getter 函数创建一个计算属性 `age`，该计算属性的值会根据 `user.age` 的变化而自动更新。

```ts
import { computed } from '../computed'
import { reactive } from '../reactive'

describe('computed', () => {
	it('computed', () => {
		const user = reactive({
			age: 1,
		})
		const age = computed(() => {
			return user.age
		})
		expect(age.value).toBe(1)
	})
})
```

computed.ts

```ts
class ComputedRefImpl {
    private _getter: any
    constructor(getter) {
        this._getter = getter
    }
    get value() {
        return this._getter()
    }
}

export function computed(getter) {
    return new ComputedRefImpl(getter)
}
```

#### 功能单测2

computed.spec.ts

> 接受一个 [getter 函数](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Functions/get#description)，返回一个只读的响应式 [ref](https://cn.vuejs.org/api/reactivity-core.html#ref) 对象。该 ref 通过 `.value` 暴露 getter 函数的返回值。它也可以接受一个带有 `get` 和 `set` 函数的对象来创建一个可写的 ref 对象。

```ts
it('should compute lazily', () => {
    const value = reactive({
        foo: 1,
    })
    const getter = jest.fn(() => {
        return value.foo
    })
    const cValue = computed(getter)
    expect(getter).not.toHaveBeenCalled()
    expect(cValue.value).toBe(1)
    expect(getter).toHaveBeenCalledTimes(1)
    // 再次访问，不应该再调用
    cValue.value
    expect(getter).toHaveBeenCalledTimes(1)
    // 不应该再调用
    value.foo = 2
    expect(getter).toHaveBeenCalledTimes(1)
    // 触发getter
    expect(cValue.value).toBe(2)
    expect(getter).toHaveBeenCalledTimes(2)
    // 不应该再调用
    cValue.value
    expect(getter).toHaveBeenCalledTimes(2)		
})
```

computed.ts

```ts
import { ReactiveEffect } from './effect'

class ComputedRefImpl {
    private _getter: any
    private _value: any
    private _dirty: boolean = true
    private _effect: any
    constructor(getter) {
        this._getter = getter
        this._effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) {
                this._dirty = true
            }
        })
    }
    get value() {
        if (this._dirty) {
            this._dirty = false
            this._value = this._effect.run()
        }
        return this._value
    }
}

export function computed(getter) {
    return new ComputedRefImpl(getter)
}
```

## runtime-core 初始化流程实现

### 总览导图

> 全程跟着这个流程图实现

![runtime-core](C:\Users\DELL\Downloads\runtime-core.jpg)

创建src / runtime-core文件夹

> 这次的测试样例放在根目录下的example / helloworld

### 初始化 component 主流程

#### 测试文件

example / helloworld / index.html

```html
<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>Document</title>
	</head>
	<body>
        <div id="app"></div>
		<script src="main.js" type="module"></script>
	</body>
</html>
```

以下文件模拟Vue3

main.js

```ts
createApp(App).mount('#app')
👇
createApp(App) + app.mount('#app')
//创建一个根组件App(Vue应用实例)，然后将其挂载到<div id="app"></div>中，从此这个 <div> 里的内容由 Vue 接管，Vue 会根据 App 的图纸，在<div>中渲染出你写的组件
```

App.js

> !!! 有关虚拟节点 先去看看这篇文章[vue3虚拟dom详解(含源码) - 掘金](https://juejin.cn/post/7323031996864446505) !!!

```js
export const App = {
	render() {//UI逻辑
		return h( //Vue 中的创建虚拟 DOM 的辅助函数,用于创建虚拟 DOM 节点,接收三个参数：
			'div', //要创建的 HTML 标签名或组件选项对象.
			'hi, ' + this.msg //子节点,可以是字符串、数字、数组或其他虚拟 DOM 节点.
		)
	},
	setup() {//组合式 API 的入口点,用于组合组件的逻辑，例如响应式数据、生命周期钩子、计算属性等
		return {
			msg: 'mini-vue',
		}
	},
}
```

#### 基础实现

createApp.ts

```ts
export function createApp(rootComponent: any) { // 传入根组件
	return {
		mount(rootContainer: any) { // 挂载回根容器
			// 先把根组件转换成虚拟节点vnode
			// 之后所有的操作都会基于vnode做处理
			const vnode = createVNode(rootComponent)
		},
	}
}
```

vnode.ts

```ts
export function createVNode(type: any, props?: any, children?: any) {
    const vnode = {
        type,// 类型
        props,// 属性
        children,// 孩子
        el: null,// 对应的真实dom
        component: null,// 组件实例
        key: props?.key,// 唯一标识
        // shapeFlag: getShapeFlag(type), // 类型标识
    }
    return vnode
}
```

添加render函数

```ts
mount(rootContainer: any) {
    const vnode = createVNode(rootComponent)

    render(vnode, rootContainer)
},
```

renderer.ts

```ts
import { createComponentInstance } from "./component"

export function render(vnode: any, container: any) {
	// 调用patch函数
	patch(vnode, container)
}

function patch(vnode: any, container: any) {
	if (vnode.shapeFlag === 1) {
		// 处理element
		processElement(vnode, container)	
	}else if (vnode.shapeFlag === 8) {
		// 处理component
		processComponent(vnode, container)
	}
}

function processElement(vnode: any, container: any) {
	mountElement(vnode, container)	
}

function mountElement(vnode: any, container: any) {
    // 创建组件实例对象
	const instance = createComponentInstance(vnode)

	// 处理组件的setup
	setupComponent(instance)

	// 处理组件的render
	setupRenderEffect(instance, vnode, container)
}
```

component.ts

```ts
export function createComponentInstance(vnode: any) {
    const instance = {
        vnode,          // 组件的虚拟节点（设计图）
        type: vnode.type, // 组件定义（比如你写的 .vue 文件中的对象）
        props: vnode.props, // 外部传入的属性
        slots: vnode.slots, // 插槽内容（类似 `<template #header>`）
        proxy: null,     // 代理对象（用于访问数据和属性）
    };
    return instance;
}

export function setupComponent(instance: any) {
    // 初始化组件
    initProps(instance)
    initSlots(instance)

    // 处理组件的setup
    setupStatefulComponent(instance)
}

export function setupStatefulComponent(instance: any) {
    // 先拿到组件
    const Component = instance.type // 组件定义（比如你写的 setup 函数）

    // 代理对象（用于访问数据和属性）
    instance.proxy = new Proxy(instance, {
        get(target, key) {
            const { setup, props } = target

            if (key in setup) {// 优先从 setup 返回值中找
                return setup[key]			
            }	else if (key in props) {// 其次从 props 中找
                return props[key]
            }
            return Reflect.get(target, key)
        }
    })	

    const { setup } = Component //解构出setup

    if (setup) {
        setCurrentInstance(instance) // 标记“当前对象是谁”
        const setupResult = setup() // 执行你的 setup 函数
        setCurrentInstance(null) // 清除标记

        handleSetupResult(instance, setupResult) // 保存 setup 返回值
    }else {
        finishComponentSetup(instance) // 没有 setup 直接完成初始化
    }
}

function handleSetupResult(instance: any, setupResult: any) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult; // 保存 setup 返回的对象
    }
    finishComponentSetup(instance); // 完成组装
}

function finishComponentSetup(instance: any) {
    const Component = instance.type;
    // 确定 render 函数（你写的 template 会被编译成 render 函数）
    instance.render = Component.render || instance.vnode.render;
    // 准备渲染（虚拟 DOM 生成真实 DOM）
    setupRenderEffect(instance);
}
```

renderer.ts 继续完善逻辑

> 回调render，实现 “拆箱” 

```ts
function setupRenderEffect(instance: any, vnode: any, container: any) {
	const { proxy } = instance
	const subTree = instance.render.call(proxy) //拿到虚拟节点树

	// vnode -> patch
	// vnode -> element -> mountElement
	patch(subTree, container)

	vnode.el = subTree.el
}
```

### 使用 rollup 打包库

>rollup一般用于库的打包，而webpack更多用于应用的打包
>
>> 构建输出的作用👇
>>
>> ```
>> 提供对不同模块格式的支持，增强库的兼容性
>> 优化代码体积与性能
>> 简化库的分发与使用流程，促进组件复用
>> 实现按需加载
>> ```
>>
>> 在以下案例中就构建了两种格式 CommonJS & ES Module 的文件

#### 配置rollup

安装

```
pnpm install --global rollup
```

安装官方依赖

```
pnpm install @rollup/plugin-typescript --save-dev
pnpm install tslib
```

> 创建 src / index.ts 作为 mini-vue 的出入口

rollup.config.js 编写脚本文件

```js
import pkg from './package.json' assert { type: 'json' } // 导入格式文件
import typescript from '@rollup/plugin-typescript'

export default {
    input: 'src/index.ts', // 入口文件
    output: [
        {
            file: pkg.main, // 输出的 CommonJS 格式文件
            format: 'cjs', // 指定输出格式为 CommonJS
        },
        {
            file: pkg.module, // 输出的 ES Module 格式文件
            format: 'es', // 指定输出格式为 ES Module
        }
    ],
    plugins: [
        // 插件列表
        typescript(),
    ]
};
```

> 构建的输出文件就是lib下的 guide-mini-vue.cjs.js & guide-mini-vue.esm.js 这两个文件

在package.json中打开并添加依赖

```json
"name": "my-mini-vue",
"version": "1.0.0",
"type": "module",
"main": "lib/guide-mini-vue.cjs.js", // 输出的 CommonJS 格式文件
"module": "lib/guide-mini-vue.esm.js", // 输出的 ES Module 格式文件
"license": "ISC",
```

```json
"scripts": {
    "test": "jest",
    "build": "rollup -c config.js"
},
```

更改tsconfig.json依赖项

```json
"module": "esnext",
```

#### 使用

处理src下的index文件

```ts
// mini-vue 的入口
export * from './runtime-core'
```

再处理runtime-core下的index文件

```ts
export { createApp } from "./createApp";
```

> pnpm build 即可构建两种格式的文件

***补充h函数逻辑***

> 前情提要
>
> example下的App.js文件
>
> ```js
> export const App = {
>     render() { // UI逻辑
>         return h( // Vue 中的创建虚拟 DOM 的辅助函数,用于创建虚拟 DOM 节点,接收三个参数：
>             'div', // type：要创建的 HTML 标签名或组件选项对象.
>             { id: 'root', class: ['red', 'hard'] }, // props：标签属性,可以是一个 对象 或 数组.
>             'hi, ' + this.msg // children：子节点,可以是 字符串、数字、数组、其他虚拟 DOM 节点.
>         )
>     },
>     setup() { // 组合式 API 的入口点,用于组合组件的逻辑，例如响应式数据、生命周期钩子、计算属性等
>         return {
>             msg: 'mini-vue',
>         }
>     },
> }
> ```

runtime-core / h.ts

```ts
import { createVNode } from "./vnode";

export function h(type: any, props?: any, children?: any) {
	return createVNode(type, props, children)
}
```

runtime-core / index.ts

```ts
export { createApp } from './createApp'
import { h } from './h'
```

>pnpm build 继续构建到 example 测试项目里

然后就可以在example中直接引用构建下来的文件

main.js

```ts
// vue3
import { createApp } from '../../lib/guide-mini-vue.esm.js' // 导入自己构建的文件
import { App } from './App.js'

createApp(App).mount('#app')
```

然后就可以打开HTML文件了

### 初始化 Element 主流程

回到patch函数，继续完善

```ts
function patch(vnode: any, container: any) {
	console.log(vnode)
	console.log(vnode.type)
	console.log(container)
	if (typeof vnode.type === 'string') {// 处理元素
		processElement(vnode, container)
	} else if (typeof vnode.type === 'object') {// 处理组件
		processComponent(vnode, container)
	}
}
```

```ts
function processElement(vnode: any, container: any) {
	mountElement(vnode, container)	
}
```

```ts
function processElement(vnode: any, container: any) {
	mountElement(vnode, container)
}
```

#### 分支-mountElement初始化

> 把虚拟节点vnode转化为一个真实的dom元素

```ts
function mountElement(vnode: any, container: any) {
	const el = document.createElement(vnode.type) // 创建真实dom

	const { children, props } = vnode

	if (typeof children === 'string') {
		el.textContent = children // 文本节点
	} else if (Array.isArray(children)) {
		mountChildren(vnode, container) // 处理children
	}

	if (props) {
		for (const key in props) {
			const val = props[key] // 拿到属性值
			el.setAttribute(key, val) // 给真实dom设置属性
		}
	}

	container.append(el) // 挂载到容器中
}
```

完善mountChildren函数

```ts
function mountChildren(vnode: any, container: any) {
	vnode.children.forEach((v: any) => {
		patch(v, container) // 递归处理children
	})
}
```



#### 分支-processElement初始化



### 完善代理对象

setupStatefulComponent 新增 创建代理对象 逻辑

```ts
// 创建代理对象
instance.proxy = new Proxy({ _: instance }, componentPublicInstance)
```

创建 componentPublicInstance.ts

```ts
const publidPropertyMap = {
	$el: (i) => i.vnode.el,
	// $slots: (i) => i.slots,
	// $props: (i) => i.props,	
}

export const PublicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		const { setupState, props } = instance
		if (key in setupState) {
			return setupState[key]
		}

		const publicGetter = publidPropertyMap[key]
		if (publicGetter) {
			return publicGetter(instance)
		}
	},
}
```

### 实现shapeFlags

#### 位运算实现

shared目录

ShapeFlags.ts

```js
export const enum ShapeFlags {
	ELEMENT = 1, // 0001
	STATEFUL_COMPONENT = 1 << 1, // 0010
	TEXT_CHILDREN = 1 << 2, // 0100
	ARRAY_CHILDREN = 1 << 3, // 1000
}
```

test.ts

```ts
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
```

#### 更改逻辑

重写vnode

```ts
import { ShapeFlags } from '../shared/ShapeFlags'

export function createVNode(type: any, props?: any, children?: any) {
	const vnode = {
		type, // 类型
		props, // 属性
		children, // 孩子
		el: null, // 对应的真实dom
		component: null, // 组件实例
		key: props?.key, // 唯一标识
		shapeFlag: getShapeFlag(type), // 类型标识
	}

	if (typeof children === 'string') {
		vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN // 0001 | 0100 = 0101
	} else if (Array.isArray(children)) {
		vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN // 0001 | 1000 = 1001
	}

	return vnode
}

function getShapeFlag(type: any) {
	return typeof type === 'string'
		? ShapeFlags.ELEMENT
		: ShapeFlags.STATEFUL_COMPONENT
}
```

更改patch逻辑

```ts
function patch(vnode: any, container: any) {
	console.log(vnode)
	console.log(vnode.type) // 打印render&setup
	console.log(container) // 打印<div id="app"></div>
	const { shapeFlag } = vnode
	if (shapeFlag & ShapeFlags.ELEMENT) {
		// 处理元素
		processElement(vnode, container)
	} else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
		// 处理组件
		processComponent(vnode, container)
	}
}
```

更改mountElement逻辑

```ts
function mountElement(vnode: any, container: any) {
	const el = document.createElement(vnode.type) as HTMLElement // 创建真实dom

	const { children, props, shapeFlag } = vnode

	if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
		el.textContent = children // 文本节点
	} else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
		mountChildren(vnode, el) // 处理children
	}

	if (props) {
		for (const key in props) {
			const val = props[key] // 拿到属性值
			el.setAttribute(key, val) // 给真实dom设置属性
		}
	}

	container.append(el) // 挂载到容器中
}
```

### 实现注册事件

```ts
return h(
    // Vue 中的创建虚拟 DOM 的辅助函数,用于创建虚拟 DOM 节点,接收三个参数：
    'div', // 要创建的 HTML 标签名或组件选项对象.
    {
        id: 'root',
        class: ['red', 'hard'],
        onClick() {
            //添加事件
            console.log('click')
            this.msg = 'vue'
        },
        onMousedown() {
            console.log('mouse down')
        },
    }, // 标签属性,可以是一个对象或数组.
    'hi,' + this.msg // 子节点,可以是字符串、数字、数组或其他虚拟 DOM 节点.
    // 'hi, mini-vue' //string类型
    // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]// 数组类型
)
```

更改mountElement逻辑

```ts
function mountElement(vnode, container) {
    const el = (vnode.el = document.createElement(vnode.type)); // 创建真实dom <div></div>
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

#### 样例版

```ts
for (const key in props) {
    const val = props[key] // 拿到属性值
    if (key === 'onClick') {
        el.addEventListener('click', val) // 给真实dom设置事件
    } else {
        el.setAttribute(key, val) // 给真实dom设置属性
    }
}
```

#### 通用版

```ts
for (const key in props) {
    const val = props[key] // 拿到属性值
    const isOn = (key: string) => /^on[A-Z]/.test(key) // 判断是否是事件
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase() // 拿到事件名
        el.addEventListener(event, val) // 给真实dom绑定事件
    } else {
        el.setAttribute(key, val) // 给真实dom绑定属性
    }
}
```

### 实现props逻辑（这个有问题啊最后复盘回来看，搞一个小时了都）

#### 新建测试

example / helloworld / Foo.js

```ts
import { h } from '../../lib/guide-mini-vue.esm'

export const Foo = {
	setup(props) {
		console.log(props)
	},
	render() {
		return h(
			'div',
			{
				onClick: () => {
					emit('add-1', 1, 2)
				},
			},
			'foo: ' + this.count
		)
	},
}
```

修改App.js

```ts
return h(
    // Vue 中的创建虚拟 DOM 的辅助函数,用于创建虚拟 DOM 节点,接收三个参数：
    'div', // 要创建的 HTML 标签名或组件选项对象.
    {
        id: 'root',
        class: ['red', 'hard'],
        onClick() {
            //添加事件
            console.log('click')
            this.msg = 'vue'
        },
        onMousedown() {
            console.log('mousedown')
        },
    }, // 标签属性,可以是一个对象或数组.
    // 'hi,' + this.msg // 子节点,可以是字符串、数字、数组或其他虚拟 DOM 节点.
    // 'hi, mini-vue' //string类型
    // [h('p', { class: 'red' }, 'hi'), h('p', { class: 'blue' }, 'mini-vue')]// 数组类型
    [h('div', {}, 'hi' + this.msg), h(Foo)] // 数组类型
)
```

#### 逻辑实现

在 setupComponent 函数中打开 initProps

```ts
export function setupComponent(instance: any) {
	// 初始化组件
	initProps(instance,instance.vnode.props)
	// initSlots(instance)

	// 处理组件的setup
	setupStatefulComponent(instance)
}
```

新建 componentProps.ts 文件

```ts
export function initProps(instance: any, rawProps: any) {
    instance.props = rawProps || {}
}
```

修改 setupStatefulComponent 逻辑

```ts
export function setupStatefulComponent(instance: any) {
	const Component = instance.type // 先拿到组件
	instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers) // 创建代理对象

	const { setup } = Component // 解构出setup

	if (setup) {
		const setupResult = setup(instance.props)
		handleSetupResult(instance, setupResult)
	} else {
		finishComponentSetup(instance)
	}
}
```

再次重构 componentPublicInstance.ts

```ts
const publidPropertyMap = {
	$el: (i) => i.vnode.el,
	// $slots: (i) => i.slots,
	// $props: (i) => i.props,
}

export const PublicInstanceProxyHandlers = {
	get({ _: instance }, key) {
		const { setupState, props } = instance
		if (key in setupState) {
			return setupState[key]
		}

		const hasOwn = (val: object, key: string) =>
			Object.prototype.hasOwnProperty.call(val, key)

		if (hasOwn(setupState, key)) {
			return setupState[key]
		} else if (props in instance) {
			return props[key]
		}

		const publicGetter = publidPropertyMap[key]
		if (publicGetter) {
			return publicGetter(instance)
		}
	},
}
```

使用之前写的 shallowReadonly 函数实现 props 属性浅层只读

```ts
export function setupStatefulComponent(instance: any) {
	const Component = instance.type // 先拿到组件
	instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers) // 创建代理对象

	const { setup } = Component // 解构出setup

	if (setup) {
		const setupResult = setup(shallowReadonly(instance.props))
		handleSetupResult(instance, setupResult)
	} else {
		finishComponentSetup(instance)
	}
}
```

>回顾 shallowReadonly

```ts
export function shallowReadonly(raw) {
	return createActiveEffect(raw, shallowReadonlyHandlers)
}
```

优化 createActiveEffect 逻辑

```ts
function createActiveEffect(raw: any, baseHanders) {
	// 1.判断是否是对象
	if (!isObject(raw)) {
		console.warn(`target ${raw} 必须是一个对象`)
		return raw
	}
	
	// 2.如果已经是代理对象，不需要再次代理
	if (raw[ReactiveFlags.IS_REACTIVE] || raw[ReactiveFlags.IS_READONLY]) {
		return raw		
	}

	// 3.创建代理对象
	return new Proxy(raw, baseHanders)
}
```

### 实现emit功能

#### 新建测试

example \ componentEmit \ App.js

```ts
import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
	name: 'App',
	render() {
		return h('div', {}, [
			h('div', {}, 'App'),
			h(Foo, {
				onAdd() {
					console.log('onAdd')
				},
			}),
		])
	},
	setup() {
		return {}
	},
}
```

example \ componentEmit \ Foo.js

```ts
import { h } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
	setup(props, { emit }) {
		const emitAdd = () => {
			console.log('emitAdd')
			emit('add')
		}

		return {
			emitAdd,
		}
	},
	render() {
		const btn = h('button', { onClick: this.emitAdd }, 'emitAdd')

		const foo = h('p', {}, 'foo')
		return h('div', {}, [foo, btn])
	},
}
```

#### 逻辑实现

修改 setupStatefulComponent 逻辑

```ts
export function setupStatefulComponent(instance: any) {
    const Component = instance.type // 先拿到组件
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers) // 创建代理对象

    const { setup } = Component // 解构出setup

    if (setup) {
        const setupResult = setup(shallowReadonly(instance.props),{
            emit:instance.emit,
        })
        handleSetupResult(instance, setupResult)
    } else {
        finishComponentSetup(instance)
    }
}
```

修改 setupStatefulComponent 逻辑

```ts
export function createComponentInstance(vnode: any) {
	const instance = {
		vnode,
		type: vnode.type,
		props: vnode.props,
		slots: vnode.slots,
		proxy: null, // 代理对象
		emit: () => {}, // 事件
	}
	instance.emit = emit as any
	return instance
}
```

添加 componentEmit.ts 文件

```ts
export function emit(instance, event, ...args) {
    const { props } = instance;
    const handler = props[`on${event}`];
    handler && handler(...args);
}
```





### 实现slots功能

#### 新建测试

#### 逻辑实现











## runtime-dom 封装DOM方法

## compiler-core 编译逻辑和算法

## compiler-sfc 解析.vue组件

## compiler-dom 处理template标签
