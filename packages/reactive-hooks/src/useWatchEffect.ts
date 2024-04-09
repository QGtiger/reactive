import { watchEffect } from "@lightfish/reactive";
import { useEffect, useRef } from "react";

export function useWatchEffect(effect: () => void | (() => void)) {
  const latestEffect = useRef(effect)
  latestEffect.current = effect

  useEffect(() => {
    let effectCleanup: void | (() => void);

    const clearnUp = watchEffect(() => {
      effectCleanup && effectCleanup()
      effectCleanup = latestEffect.current?.()
    })

    return () => {
      clearnUp()
      effectCleanup && effectCleanup()
    }
  }, [])
}