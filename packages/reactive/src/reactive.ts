import { ObserverConfig, reactiveObserver } from "@lightfish/reactive-core";

export function reactive<T extends object>(target: T, config?: ObserverConfig) {
  return reactiveObserver(target, config);
}