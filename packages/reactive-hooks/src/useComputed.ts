import { useRef, useState } from "react"
import { useWatchEffect } from "./useWatchEffect"

export function useComputed<T>(getter: () => T) {
  const [value, setValue] = useState<T>()
  const latestGetter = useRef(getter)
  latestGetter.current = getter

  useWatchEffect(() => {
    setValue(latestGetter.current?.())
  })

  return value
}