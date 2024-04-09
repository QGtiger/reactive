import { EffectWatcher } from "@lightfish/reactive-core"

interface WatchEffectOptions {
  sync?: boolean
}

type StopHandle = () => void

export function watchEffect(
  effect: () => any,
  options?: WatchEffectOptions
): StopHandle {
  const effectWatcher = new EffectWatcher(effect, options)
  return () => {
    effectWatcher.destroy()
  }
}