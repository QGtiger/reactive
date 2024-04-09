import { reactiveObserver } from "@lightfish/reactive-core";

export function reactive<T extends object>(target: T) {
  return reactiveObserver(target);
}