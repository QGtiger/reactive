import { depend, popTarget, pushTarget } from "../observer"

const defaultOptions = {
  lazy: false
}

export class Watcher<T = any> {
  private value!: T
  private dirty: boolean = true
  // 当前watch， 依赖于 哪些属性。 用于清除依赖
  private depSet: Set<Set<Watcher>> = new Set()

  getOptions() {
    return this.options || defaultOptions
  }

  constructor(public getter: () => T, public options?: {
    lazy: boolean
  }) {
    const {lazy} = this.getOptions()
    if (lazy) {
      // 惰性属性
    } else {
      this.getterWithTrack()
    }
  }

  /**
   * 执行副作用
   */
  run () {
    const {lazy} = this.getOptions()
    this.dirty = true
    if (!lazy) {
      // queue watcher 微任务 TODO
      this.getterWithTrack()
    }
  }

  /**
   * 执行getter 用作依赖追踪
   * @returns 
   */
  getterWithTrack() {
    if (this.dirty) {
      this.value = this.getterByCollectDep()
    }

    this.dependDepSet()
    return this.value
  }

  /**
   * 执行getter 获取依赖. 先清除依赖
   * @returns 
   */
  getterByCollectDep() {
    pushTarget(this)
    let v: any
    try {
      this.cleanUpDeps()
      v = this.getter()
    } catch(e) {
      console.error(e)
    } finally {
      this.dirty = false
      popTarget()
    }

    return v
  }

  /**
   * 将当前watcher 所依赖的 副作用集合，进行一次依赖收集
   * 比如 a 属性 副作用集合 有 A, B
   * b => C
   * 那 属性 c = a + b. 所以 要将 A， B， C 都进行依赖收集
   */
  dependDepSet() {
    this.depSet.forEach(_set => {
      depend(_set)
    })
  }

  /**
   * 副作用集合，放到 当前 watcher。 用作后续清除依赖
   * @param s 
   */
  addDep(s: Set<any>) {
    this.depSet.add(s)
  }

  /**
   * 清除依赖
   */
  cleanUpDeps() {
    this.depSet.forEach((_set) => {
      _set.delete(this);
      if (!_set.size) {
        this.depSet.delete(_set)
      }
    });

  }

  destroy() {
    this.cleanUpDeps()
  }
}