import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import { useComputed, useReactive, useWatchEffect } from '@lightfish/reactive-hooks'
import './App.css';

// mobx

const store = makeObserver({
  a: 10
})

function connect(effect: Function) {
  const [, update] = useState()
  Dep.target = update
  return effect()
}

function T() {
  function pp() {
    store.a = 1000
  }
  return (
    <div className="a" onClick={() => {
      pp()
    }}>{store.a}</div>
  )
}

const WT = connect(T)

function App() {
  const data = useReactive({
    name: 'Lightfish',
    salary: 3000,
    rentingHouse: 1800,
    eating: 1500,
    extra: 500,

    tips: ''
  })

  useEffect(() => {
    // @ts-expect-error
    window.data = data
  }, [])

  const savedMoney = useComputed(() => {
    console.log('savedMoney!!!!')
    return data.salary - data.rentingHouse - data.eating - data.extra
  })

  useWatchEffect(() => {
    data.tips = `My name is ${data.name}, I saved ${savedMoney.value} every month. ${savedMoney.value > 1000 ? 'Good job!' : 'Keep going!'}`

    return () => {
      console.log(1111)
    }
  })

  console.log('render')

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <p>{data.tips}</p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
