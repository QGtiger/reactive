import { reactive } from "@lightfish/reactive";
import { useCallback, useMemo, useState } from "react";

export function useReactive<T extends object>(obj: T) {
  const [ _, setState ] = useState<any>({})

  const update = useCallback(() => {
    setState({})
  }, [])

  return useMemo(() => {
    return reactive(obj, {
      onTrigger(target, key, value, oldValue) {
        update()
      },
    })
  }, [])
}