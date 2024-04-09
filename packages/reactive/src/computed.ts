import { EffectWatcher } from "@lightfish/reactive-core";

export function computed<T>(getter: () => T) {
  const _effectWatcher = new EffectWatcher(getter, {
    lazy: true
  })
  return {
    get value() {
      return _effectWatcher.getterWithTrack()
    },
    cleanUp() {
      _effectWatcher.destroy()
    }
  }
}