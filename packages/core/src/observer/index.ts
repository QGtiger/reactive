import { handleProxyData } from "./proxy"

type WatcherType = {
  addDep: (s: Set<WatcherType>) => void // 将回调Set 也放到 watcher 里面，这样watcher内可以直接清楚依赖
  update: () => void // 依赖修改后 watcher 执行
}

class Dep {
  static target?: WatcherType
}

const stackDepTargets: WatcherType[] = []

export function pushTarget(t: WatcherType) {
  stackDepTargets.push(t)
  return Dep.target = t
}

export function popTarget() {
  stackDepTargets.pop()
  return Dep.target = stackDepTargets[stackDepTargets.length - 1]
}

/**
 * 搜集依赖
 * @param effectSet 副作用集合 Set
 * @returns 
 */
export function depend(effectSet: Set<WatcherType>) {
  const _w = Dep.target
  if (!_w) return

  // wacher 添加 副作用集合，用作 内部清除依赖
  _w.addDep(effectSet)
  effectSet.add(_w)
}

/**
 * kv 结构， k是响应式数据， v 是响应式对象里面的 每一个key 所存储的 对调List
 * 这里是使用 Set做存储，保持唯一性
 * 为啥是kv 结构呢。 因为 setter 执行的时候就是给出 target（响应数据） 和 key（具体修改的属性key）
 */
const depWeakMap = new WeakMap<any, Map<string, Set<WatcherType>>>()

/**
 * 触发 被依赖watcher 的执行 run
 * @param target 响应式数据
 * @param key trigger 触发 key对象的 set 回调
 */
function trigger(target: any, key: string) {
  const tMap = depWeakMap.get(target)
  if (!tMap) return

  const tkSet = tMap.get(key)
  if (!tkSet) return

  const cbs = Array.from(tkSet)
  cbs.forEach(w => {
    // 执行回调
    w.update()
  })
}

// 跟踪依赖
function track(target: any, key: string) {
  let tMap = depWeakMap.get(target)
  if (!tMap) {
    tMap = new Map()
    depWeakMap.set(target, tMap)
  }

  let tkSet = tMap.get(key)
  if (!tkSet) {
    tkSet = new Set()
    tMap.set(key, tkSet)
  }

  depend(tkSet)
}

export type ObserverConfig = {
  onTrigger?: (target: any, key: any, value: any, oldValue: any) => void,
  onTrack?: (target: any, key: any) => void
}

/**
 * 响应式数据
 * @param data 源数据
 * @returns 
 */
export function observer<T>(data: T, config?: ObserverConfig): T {
  return handleProxyData(data, (t, k) => {
    config?.onTrack?.(t, k)
    track(t, k)
  }, (t, k, v, ov) => {
    config?.onTrigger?.(t, k, v, ov)
    trigger(t, k)
  })
}