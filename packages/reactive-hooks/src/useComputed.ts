import { useEffect, useMemo } from "react"
import { computed } from "@lightfish/reactive"

export function useComputed<T>(getter: () => T) {
  const _computedRef = useMemo(() => {
    return computed(getter)
  }, [])

  useEffect(() => {
    return () => {
      _computedRef.cleanUp()
    }
  }, [])

  return _computedRef
}