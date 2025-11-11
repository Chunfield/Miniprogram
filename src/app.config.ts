export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/my/my',
    'pages/create/create'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'AI生图',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999',
    selectedColor: '#667eea',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页'
      },
      {
        pagePath: 'pages/my/my',
        text: '我的'
      }
    ]
  },
  // usingComponents: {
  //   // 't-button': 'tdesign-miniprogram/button/button',
  //   // 't-input': 'tdesign-miniprogram/input/input',
  //   // 't-image': 'tdesign-miniprogram/image/image',
  //   // 't-loading': 'tdesign-miniprogram/loading/loading',
  //   // 't-toast': 'tdesign-miniprogram/toast/toast',
  //   't-button': 'tdesign-miniprogram/button/index',
  //   't-input': 'tdesign-miniprogram/input/index',
  //   't-image': 'tdesign-miniprogram/image/index',
  //   't-loading': 'tdesign-miniprogram/loading/index',
  //   't-toast': 'tdesign-miniprogram/toast/index'
      
  // }
})
