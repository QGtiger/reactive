import { reactive } from "./reactive"
import { watchEffect } from "./watchEffect"

const proxyData = reactive({
  name: 'lightfish',
  salary: 3000,
  eating: 1000,
  renting: 1800
})

watchEffect(function effect1() {
 const { name, salary, eating, renting } = proxyData
 console.log(`大噶好，我叫${name}, 每个月薪资${salary}, 吃饭要花销${eating}，住房${renting}`)
})

watchEffect((() => {
 let _name: any
 return function effect2() {
   console.log(_name ? `我改名字啦，之前是${_name}, 现在是 ${proxyData.name}` : `大噶好，我叫${proxyData.name}`)
   _name = proxyData.name
 }
})())

proxyData.name = '123123'