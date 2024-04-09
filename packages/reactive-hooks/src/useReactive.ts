import { reactive } from "@lightfish/reactive";
import { useMemo } from "react";

export function useReactive<T extends object>(obj: T) {
  return useMemo(() => {
    return reactive(obj)
  }, [obj])
}