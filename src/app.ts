import { PropsWithChildren } from 'react'
import Taro, { useLaunch } from '@tarojs/taro'


import './app.css'

function App({ children }: PropsWithChildren<any>) {
  useLaunch(() => {
    console.log('App launched.')
    // 初始化微信云开发
    const envId = 'cloud1-8ghvj56v09766859'
    try {
      // @ts-ignore
      if (Taro.cloud && typeof Taro.cloud.init === 'function') {
        // @ts-ignore
        Taro.cloud.init({ env: envId })
        console.log('Cloud initialized with env:', envId)
      } else {
        console.warn('Taro.cloud 未可用，跳过云开发初始化')
      }
    } catch (e) {
      console.error('云开发初始化失败', e)
    }
  })

  // children 是将要会渲染的页面
  return children
}
  


export default App
