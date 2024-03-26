const cachedData = new WeakMap<any, any>();

/**
 * 将对象处理成 代理对象，拦截 getter 和setter。
 * @param data 被代理对象
 * @param getter 代理对象属性 Getter
 * @param setter 代理对象属性的 Setter
 * @returns 代理对象
 */
export function handleProxyData<T>(
  data: T,
  getter: (target: object, key: any) => void,
  setter: (target: object, k: any, val: any, oldVal: any) => void,
): T {
  if (typeof data !== 'object' || data === null) return data;
  const t = cachedData.get(data);
  if (t) return t;
  const proxyObj: T = new Proxy(data, {
    get(target, key) {
      getter(target, key);
      return handleProxyData(Reflect.get(target, key), getter, setter);
    },

    set(target, key, val) {
      const oldVal = Reflect.get(target, key);
      const isSetSuc = Reflect.set(target, key, handleProxyData(val, getter, setter));
      // 数组方法修改的话，是先修改 key 比如 push, 是先 设置push item 索引（这个时候length 已经被修改了）。 然后再去设置 length。
      if (setter) {
        // 数组的话。修改 length就直接触发好了。 而且，一些遍历方法，基本都用到length 作为边界判断，所以，触发更新问题不大
        if (Array.isArray(target) && key === 'length') {
          setter(target, key, val, oldVal);
        } else if (oldVal !== val) {
          setter(target, key, val, oldVal);
        }
      }
      return isSetSuc;
    },
  });

  cachedData.set(proxyObj, proxyObj);
  cachedData.set(data, proxyObj);
  return proxyObj;
}
