# mini-vue 解构笔记

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

# 结构简述

## **核心模块包（packages/）**

------

### **compiler-core（模板编译器核心）**

```
├─ parse.ts          # 模板解析器（生成AST）
├─ transform.ts      # AST转换器（处理指令、表达式等）
├─ codegen.ts        # 代码生成器（生成渲染函数字符串）
└─ transforms/       # 具体转换逻辑
   ├─ transformElement.ts  # 处理元素节点
   ├─ transformExpression.ts # 处理动态表达式（如 {{ }}）
   └─ transformText.ts     # 处理文本节点
```

**核心作用**：将模板字符串编译为可执行的渲染函数

------

### **reactivity（响应式系统）**

```
├─ reactive.ts      # 响应式对象实现（Proxy 代理）
├─ ref.ts           # ref 实现
├─ effect.ts        # 副作用追踪系统
├─ computed.ts      # 计算属性实现
└─ dep.ts           # 依赖收集管理
```

**核心作用**：实现 Vue 的响应式数据系统（类似 Vue 3 的 `@vue/reactivity` 包）

------

### **runtime-core（运行时核心）**

```
├─ component.ts        # 组件实例管理
├─ renderer.ts         # 渲染器核心（patch 算法）
├─ vnode.ts            # 虚拟节点（VNode）定义
├─ scheduler.ts        # 异步更新调度器（nextTick 实现）
├─ apiWatch.ts         # watch API 实现
└─ componentProps.ts   # 组件 Props 处理
```

**核心作用**：实现虚拟 DOM 的创建、更新和组件生命周期管理

------

### **runtime-dom（浏览器 DOM 运行时）**

```
└─ index.ts  # 浏览器平台专用的 DOM 操作 API
```

**核心作用**：提供浏览器环境的 DOM 操作接口（如 `createElement`, `setAttribute`）

------

### **shared（共享工具）**

```
├─ shapeFlags.ts       # 虚拟节点类型标志位
└─ toDisplayString.ts  # 值到字符串的转换工具
```

**核心作用**：存放公共工具函数和类型定义

------

## **测试**

| 目录/文件       | 功能说明                  |
| :-------------- | :------------------------ |
| `__tests__/`    | 单元测试目录              |
| `runtime-test/` | 用于测试的轻量级 DOM 实现 |
| `cypress/`      | E2E 测试配置及用例        |
| `*.spec.ts`     | Vitest 单元测试用例       |

------

## **示例（example/）**

```
├─ helloWorld/      # 基础示例
├─ componentEmit/   # 组件事件示例
├─ customRenderer/  # 自定义渲染器示例
└─ patchChildren/   # 虚拟 DOM 的 diff 算法示例
```

**作用**：展示框架功能的实际使用场景

------

## **其他**

| 文件/目录          | 功能说明                                     |
| :----------------- | :------------------------------------------- |
| `LICENSE`          | 开源协议文件（MIT 常见）                     |
| `pnpm-*.yaml`      | 包管理器配置，支持 monorepo 工作区           |
| `rollup.config.js` | 打包工具配置，用于生成不同模块格式的构建产物 |
| `vitest.config.ts` | 单元测试框架配置                             |

------

## **构建输出（dist/）**

| 文件                      | 作用                   |
| :------------------------ | :--------------------- |
| `mini-vue.cjs.js`         | CommonJS 格式的生产包  |
| `mini-vue.esm-bundler.js` | ES Module 格式的构建包 |

------

## **源码协作流程**

1. **模板编译**：
   `compiler-core` 将模板编译为渲染函数（如 `render() { ... }`）
2. **响应式驱动**：
   `reactivity` 系统追踪数据变化，触发 `effect` 更新
3. **虚拟 DOM 更新**：
   `runtime-core` 的渲染器通过 `patch` 算法对比新旧 VNode
4. **DOM 操作**：
   `runtime-dom` 执行实际的 DOM 更新操作

------

## **开发调试流程**

1. 通过 `example/*` 编写示例
2. 使用 `vitest` 运行单元测试
3. 通过 `rollup` 打包生成构建产物
4. 使用 `cypress` 运行端到端测试

# 源码追踪

## mini-vue

## ├─ LICENSE



## ├─ package.json



## ├─ packages



### ├─ compiler-core（模板编译器）



#### ├─ package.json



#### ├─ src



##### ├─ ast.ts



##### ├─ codegen.ts



##### ├─ compile.ts



##### ├─ index.ts



##### ├─ parse.ts



##### ├─ runtimeHelpers.ts



##### ├─ transform.ts



##### ├─ transforms



###### ├─ transformElement.ts



###### ├─ transformExpression.ts



###### └─ transformText.ts



##### └─ utils.ts



#### └─ __tests__



##### ├─ codegen.spec.ts



##### ├─ parse.spec.ts



##### ├─ transform.spec.ts



##### └─ __snapshots__



###### └─ codegen.spec.ts.snap



### ├─ reactivity（响应式）



#### ├─ package.json



#### ├─ src



##### ├─ baseHandlers.ts



##### ├─ computed.ts



##### ├─ dep.ts



##### ├─ effect.ts



##### ├─ index.ts



##### ├─ reactive.ts



##### └─ ref.ts



#### └─ __tests__



##### ├─ computed.spec.ts



##### ├─ dep.spec.ts



##### ├─ effect.spec.ts



##### ├─ reactive.spec.ts



##### ├─ readonly.spec.ts



##### ├─ ref.spec.ts



##### └─ shallowReadonly.spec.ts



### ├─ runtime-core（运行时）



#### ├─ package.json



#### ├─ src



##### ├─ .pnpm-debug.log



##### ├─ apiInject.ts



##### ├─ apiWatch.ts



##### ├─ component.ts



##### ├─ componentEmits.ts



##### ├─ componentProps.ts



##### ├─ componentPublicInstance.ts



##### ├─ componentRenderUtils.ts



##### ├─ componentSlots.ts



##### ├─ createApp.ts



##### ├─ h.ts



##### ├─ helpers



###### └─ renderSlot.ts



##### ├─ index.ts



##### ├─ renderer.ts



##### ├─ scheduler.ts



##### └─ vnode.ts



#### └─ __tests__



##### ├─ apiWatch.spec.ts



##### ├─ componentEmits.spec.ts



##### ├─ rendererComponent.spec.ts



##### └─ rendererElement.spec.ts



### ├─ runtime-dom（封装DOM方法）



#### ├─ package.json



#### └─ src



##### └─ index.ts



### ├─ runtime-test（测试DOM实现）



#### └─ src



##### ├─ index.ts



##### ├─ nodeOps.ts



##### ├─ patchProp.ts



##### └─ serialize.ts



### ├─ shared（工具函数）



#### ├─ package.json



#### └─ src



##### ├─ index.ts



##### ├─ shapeFlags.ts

> 虚拟节点类型标志位



##### └─ toDisplayString.ts

> 值👉字符串 转换工具



### └─ vue（使用示例）



├─ .DS_Store



#### ├─ cypress



##### ├─ e2e



###### ├─ apiInject.cy.js



###### ├─ componentEmit.cy.js



###### ├─ componentSlots.cy.js



###### ├─ componentUpdate.cy.js



###### ├─ customRenderer.cy.js



###### ├─ getCurrentInstance.cy.js



###### ├─ helloworld.cy.js



###### ├─ nextTicker.cy.js



###### └─ patchChildren.cy.js



##### ├─ fixtures



###### └─ example.json



##### └─ support



###### ├─ commands.js



###### └─ e2e.js



#### ├─ cypress.config.js



#### ├─ dist



##### ├─ mini-vue.cjs.js



##### ├─ mini-vue.cjs.js.map



##### ├─ mini-vue.esm-bundler.js



##### └─ mini-vue.esm-bundler.js.map



#### ├─ example（示例）



##### ├─ apiInject



###### ├─ App.js



###### └─ index.html



##### ├─ compiler-base



###### ├─ App.js



###### └─ index.html



##### ├─ componentEmit



###### ├─ App.js



###### ├─ Child.js



###### └─ index.html



##### ├─ componentProxy



###### ├─ App.js



###### ├─ Child.js



###### └─ index.html



##### ├─ componentSlots



###### ├─ App.js



###### ├─ Child.js



###### └─ index.html



##### ├─ componentUpdate



###### ├─ App.js



###### ├─ Child.js



###### └─ index.html



##### ├─ createTextVnode



###### ├─ App.js



###### └─ index.html



##### ├─ customRenderer



###### ├─ App.js



###### ├─ game.js



###### ├─ index.html



###### ├─ main.js



###### └─ renderer.js



##### ├─ getCurrentInstance



###### ├─ App.js



###### └─ index.html



##### ├─ helloWorld



###### ├─ App.js



###### ├─ index.html



###### └─ main.js



##### ├─ nextTicker



###### ├─ App.js



###### ├─ index.html



###### ├─ main.js



###### └─ NextTicker.js



##### ├─ patchChildren



###### ├─ App.js



###### ├─ ArrayToArray.js



###### ├─ ArrayToText.js



###### ├─ index.html



###### ├─ main.js



###### ├─ TextToArray.js



###### └─ TextToText.js



##### ├─ renderComponent



###### ├─ App.js



###### ├─ Child.js



###### └─ index.html



##### └─ setupStateRenderComponent



###### ├─ App.js



###### └─ index.html



#### ├─ index.js



#### ├─ package.json



#### └─ src



##### └─ index.ts



## ├─ pnpm-lock.yaml



## ├─ pnpm-workspace.yaml



## ├─ README.md



## ├─ README_EN.md



## ├─ rollup.config.js



## ├─ tsconfig.json



## └─ vitest.config.ts

```ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: [
      {
        find: /@mini-vue\/([\w-]*)/,
        replacement: path.resolve(__dirname, "packages") + "/$1/src",
      },
    ],
  },
});
```







