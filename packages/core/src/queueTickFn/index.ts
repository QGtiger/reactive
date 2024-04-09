type NoopType<T = any> = (...args: any[]) => T;

// nextTick 简单原理
export const nextTick = (function () {
  let callbacks: NoopType[] = [];
  let pending = false;
  let timerFunc: NoopType;
  function nextTickHandler() {
    pending = false;
    // 之所以要slice复制一份出来是因为有的cb执行过程中又会往callbacks中加入内容
    // 比如$nextTick的回调函数里又有$nextTick
    // 这些是应该放入到下一个轮次的nextTick去执行的,
    // 所以拷贝一份当前的,遍历执行完当前的即可,避免无休止的执行下去
    const copies = callbacks.slice(0);
    callbacks = [];
    for (const element of copies) {
      element();
    }
  }

  if (typeof MutationObserver !== 'undefined') {
    let counter = 1;
    // 创建一个MutationObserver,observer监听到dom改动之后后执行回调nextTickHandler
    let observer = new MutationObserver(nextTickHandler);
    const textNode = document.createTextNode(counter + '');
    // 调用MutationObserver的接口,观测文本节点的字符内容
    observer.observe(textNode, {
      characterData: true,
    });
    timerFunc = function () {
      counter = (counter + 1) % 2;
      textNode.data = counter + '';
    };
  } else if (typeof Promise !== 'undefined') {
    timerFunc = (fnc) => {
      Promise.resolve().then(fnc);
    }
  } else {
    timerFunc = setTimeout;
  }
  return function (cb: NoopType, ctx?: any) {
    const func = ctx
      ? function () {
          cb.call(ctx);
        }
      : cb;
    callbacks.push(func);
    // 如果pending为true, 就其实表明本轮事件循环中已经执行过timerFunc(nextTickHandler, 0)
    if (pending) return;
    pending = true;
    timerFunc(nextTickHandler, 0);
  };
})();

type EffectFnc = (...args: any[]) => any;

export const queueEffectFn = (function () {
  const fnSet = new Set<NoopType>();
  const queue: {
    func: EffectFnc;
    context: any;
    args: any[];
  }[] = [];
  let flushing = false; // 是否在刷新
  let waiting = false;

  let index = 0; // 执行索引

  function resetSchedulerState() {
    fnSet.clear();
    index = queue.length = 0;
    waiting = flushing = false;
  }

  function flushSchedulerQueue() {
    flushing = true;
    for (index = 0; index < queue.length; index++) {
      const { func, context, args } = queue[index];
      // clear 一下
      fnSet.delete(func);
      func.apply(context, args);
    }

    resetSchedulerState();
  }

  return function (effectfn: EffectFnc, context?: any, ...params: any[]) {
    if (fnSet.has(effectfn)) {
      return;
    }
    fnSet.add(effectfn);

    const queueItem = {
      func: effectfn,
      context,
      args: params,
    };

    if (flushing) {
      // 在刷新的时候，直接加 后面
      queue.splice(index + 1, 0, queueItem);
    } else {
      queue.push(queueItem);
    }

    if (!waiting) {
      waiting = true;
      nextTick(flushSchedulerQueue);
    }
  };
})();
