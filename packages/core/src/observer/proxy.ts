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
      if (setter) {
        // 这里调整了下 针对数组的修改，这里就简单这样吧，length 修改了，就盘点过，数组改变了
        if (oldVal !== val) {
          setter(target, key, val, oldVal);
        }
        // else if (key === 'length') {
        //   setter(target, key, val, oldVal);
        // }
      }
      return isSetSuc;
    },
  });

  cachedData.set(proxyObj, proxyObj);
  cachedData.set(data, proxyObj);
  return proxyObj;
}
