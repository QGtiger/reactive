# 100行实现 watchEffect 和 computed

> watchEffect 和 computed 都是vue中的 api，他们都是基于vue 自身优秀的 响应式系统所脱出的 api。 其基本用法如下

```js
const data = reactive({
  count: 0
})


watchEffect(() => console.log(
  data.count
))
// -> 输出 0

// data.count++
// -> 输出 1
```

```js
const data = reactive({
  count: 0
})

const plusCount = computed(() => data.count + 1)

console.log(plusCount.value)
// -> 输出 1

data.count++
console.log(plusCount.value)
// -> 输出 2
```

所以我们只需要实现 `reactive`、`watchEffect`、 `computed` 就好了。

具体代码在 packages/core 中。

这里就简单表述下 watchEffect 的基本思路。

```ts
// 通过简单用法可以对 watchEffect做出 类型标注
declare function watchEffect(effect: Function): void

// 尝试简单 构思其中代码, 
function watchEffect(effect: Function) {
  // ...
  effect() // 传入的 effect 是立即执行的
  // ...
}

// watchEffect 是 立即运行一个函数，同时响应式地追踪其依赖，并在依赖更改时重新执行
// 响应式的最终依赖， 本质上是 effect 执行的时候，其响应式数据，触发getter 的，将当前effect 添加到 effectList 中
// 所以这里可以再进行完善

let depSet = new Set() // 依赖 effectList。 注意这里只是简单伪代码演示
let currEffect // 定义全局变量，便于后续 track

function watchEffect(effect: Function) {
  currEffect = effect
  effect() // 传入的 effect 是立即执行的
  // ...
  currEffect = null
}

// 后续响应式数据 就可以针对 get 和 set 进行track 和 trigger
const _ = new Proxy({
  name: 'lightfish'
},  {
  get(t, k) {
    // track
    // depSet.add(currEffect)
  },
  set(t, k, v) {
    // trigger
    // depSet.forEach => effect()
  }
})

```

上面只是简单的伪代码演示。 例如一些细节处理，这边并未完善。 例如这里的 `depSet` 肯定是根据 `target`, `key` 去找到的。
还有trigger不会是同步执行的。
effect执行 是需要先清除在收集。 所以这里effect 上面还需要来 一层。 去处理 当前effect的 依赖项， 执行时机等等。