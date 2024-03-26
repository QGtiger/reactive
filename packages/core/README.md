# 依赖收集

observer/proxy.ts  数据代理

* 1. 缓存机制，缓存代理对象 和 被代理对象
* 2. proxy相较于 Object.defineProperty. Proxy 是不需要递归去代理 每一属性的

## 响应式编程（Reactive Programming）

如何做依赖收集呢？

确定场景？

### 场景一

很简单的场景. 表格渲染 table

>数据源 => 根据数据源执行编程逻辑
修改数据源 => 再次执行编程逻辑

>开发者只需要维护好数据源逻辑，和编程执行逻辑

```js
// --run--

// 维护数据源，数据源更改，编程逻辑响应式执行
const a = {
  page: 1,
  size: 10,
  searchText: '你好'
}

function queryTabelData(params) {
  const { page, size, searchText } = params
  const data = Array.from({length: size}, (_, index) => {
    return `${searchText} ${index + (page - 1) * size}`
  })
  console.log('渲染table， 渲染数据为: ', data)
  return data
}

queryTabelData(a)

a.searchText = '我不好'
queryTabelData(a)

a.page = 2
a.size = 2
queryTabelData(a)
```
每次我们修改 数据源，table 查询参数，就需要我们动态去调用查询 最新查询参数的 查询结果。

这种情况就很适合使用 响应式编程，或者说是 数据驱动模型。

### 场景二

数据计算

```js
// --run--
const data = {
  numList: [1,2,3,4,5]
}

let sum = 0
function computeSum() {
  sum = (function() {
    return data.numList.reduce((res, cur) => {
      return res + cur
    }, 0)
  })()
}

computeSum()
console.log(sum)

data.numList.push(100) // sum 会修改
computeSum()
console.log(sum)

data.numList[0] = 20 // sum 也是会修改
computeSum()
console.log(sum)

data.numList = [100, 200] // sum 还是会修改
computeSum()
console.log(sum)
```
是不是需要重新计算一次，才是最新的合。这种也需要依赖收集， 收集 sum 所依赖的属性。当依赖属性发生修改后，表示当前 sum 是不准确的，dirty。 需要重新计算才是最新的。

## 如何实现

首先我们把数据做成响应式。只有做成响应式了，后续才能 监听数据的修改和使用。

```ts
declare function handleProxyData<T>(data: T, getter: (target: object, key: any) => void, setter: (target: object, k: any, val: any, oldVal: any) => void): T
```

上述方法就是将数据做成了响应式。 

然后我们在 理一遍逻辑。 本质上是如何进行依赖收集了， 是拦截了 响应式数据的 getter。 就比如上面 computeSum 方法。 在使用 data.numList 的时候，就会把 computeSum 收集到 numList 属性的 `trigger callback` 里面. 相当于就是说， numList 属性修改 Setter 的时候，就会吧 triggercallback 里面的 被依赖回调，全部执行一遍。

要画个图
| target | key | 副作用集合 |
| -- | -- | -- |
| TD | TD | TD |

## 示例

```js
// --run--
"use strict";
((global) => {
  // src/observer/proxy.ts
  var cachedData = /* @__PURE__ */ new WeakMap();
  function handleProxyData(data, getter, setter) {
    if (typeof data !== "object" || data === null)
      return data;
    const t = cachedData.get(data);
    if (t)
      return t;
    const proxyObj = new Proxy(data, {
      get(target, key) {
        getter(target, key);
        return handleProxyData(Reflect.get(target, key), getter, setter);
      },
      set(target, key, val) {
        const oldVal = Reflect.get(target, key);
        const isSetSuc = Reflect.set(target, key, handleProxyData(val, getter, setter));
        if (setter) {
          if (Array.isArray(target) && key === "length") {
            setter(target, key, val, oldVal);
          } else if (oldVal !== val) {
            setter(target, key, val, oldVal);
          }
        }
        return isSetSuc;
      }
    });
    cachedData.set(proxyObj, proxyObj);
    cachedData.set(data, proxyObj);
    return proxyObj;
  }

  // src/observer/index.ts
  var Dep = class {
  };
  var stackDepTargets = [];
  function pushTarget(t) {
    stackDepTargets.push(t);
    return Dep.target = t;
  }
  function popTarget() {
    stackDepTargets.pop();
    return Dep.target = stackDepTargets[stackDepTargets.length - 1];
  }
  function depend(effectSet) {
    const _w = Dep.target;
    if (!_w)
      return;
    _w.addDep(effectSet);
    effectSet.add(_w);
  }
  var depWeakMap = global.depWeakMap = /* @__PURE__ */ new WeakMap();
  function trigger(target, key) {
    const tMap = depWeakMap.get(target);
    if (!tMap)
      return;
    const tkSet = tMap.get(key);
    if (!tkSet)
      return;
    const cbs = Array.from(tkSet);
    cbs.forEach((w) => {
      w.run();
    });
  }
  function track(target, key) {
    let tMap = depWeakMap.get(target);
    if (!tMap) {
      tMap = /* @__PURE__ */ new Map();
      depWeakMap.set(target, tMap);
    }
    let tkSet = tMap.get(key);
    if (!tkSet) {
      tkSet = /* @__PURE__ */ new Set();
      tMap.set(key, tkSet);
    }
    depend(tkSet);
  }
  function observer(data) {
    return handleProxyData(data, track, trigger);
  }

  // src/watcher/index.ts
  var defaultOptions = {
    lazy: false
  };
  var Watcher = class {
    constructor(getter, options) {
      this.getter = getter;
      this.options = options;
      this.dirty = true;
      // 当前watch， 依赖于 哪些属性。 用于清除依赖
      this.depSet = /* @__PURE__ */ new Set();
      const { lazy } = this.getOptions();
      if (lazy) {
      } else {
        this.getterWithTrack();
      }
    }
    getOptions() {
      return this.options || defaultOptions;
    }
    /**
     * 执行副作用
     */
    run() {
      const { lazy } = this.getOptions();
      this.dirty = true;
      if (!lazy) {
        this.getterWithTrack();
      }
    }
    /**
     * 执行getter 用作依赖追踪
     * @returns 
     */
    getterWithTrack() {
      if (this.dirty) {
        this.value = this.getterByCollectDep();
      }
      this.dependDepSet();
      return this.value;
    }
    /**
     * 执行getter 获取依赖. 先清除依赖
     * @returns 
     */
    getterByCollectDep() {
      pushTarget(this);
      let v;
      try {
        this.cleanUpDeps();
        v = this.getter();
      } catch (e) {
        console.error(e);
      } finally {
        this.dirty = false;
        popTarget();
      }
      return v;
    }
    /**
     * 将当前watcher 所依赖的 副作用集合，进行一次依赖收集
     * 比如 a 属性 副作用集合 有 A, B
     * b => C
     * 那 属性 c = a + b. 所以 要将 A， B， C 都进行依赖收集
     */
    dependDepSet() {
      this.depSet.forEach((_set) => {
        depend(_set);
      });
    }
    /**
     * 副作用集合，放到 当前 watcher。 用作后续清除依赖
     * @param s 
     */
    addDep(s) {
      this.depSet.add(s);
    }
    /**
     * 清除依赖
     */
    cleanUpDeps() {
      this.depSet.forEach((_set) => {
        _set.delete(this);
      });
    }
    destroy() {
      this.cleanUpDeps();
    }
  };

  // src/index.ts
  global.makeObserver = observer;
  global.CustomWatcher = Watcher;
})(window);

const data = makeObserver({
  name: 'lightfish',
  birthday: '971211',
  hobby: ['Game', 'hiking', 'mountain climbing'],

  girlName: '甘草'
})

function sayHello(girl, msg) {
  console.log(`hi ${girl}, `, msg)
}

function computedValue(func) {
  const _w = new CustomWatcher(func, {
    lazy: true
  })
  return function() {
    return _w.getterWithTrack()
  }
}

function watchEffect(func) {
  new CustomWatcher(func)
}

const msg = computedValue(() => {
  return `I am ${data.name}. And my birthday is ${data.birthday}. My hobbies are ${data.hobby.join(',')}`
})

watchEffect(() => {
  sayHello(data.girlName, msg())
})

data.girlName = 'xuanzi'

```

