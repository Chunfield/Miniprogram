# 云函数目录结构

本项目使用微信云开发，提供 `login` 云函数，用于返回当前用户的 `openid`。

目录：

```
miniprogram/cloudfunctions/
└── login/
    ├── index.js        # 云函数入口，返回 openid/appid/env
    ├── package.json    # 声明依赖（wx-server-sdk）
    └── config.json     # （可选）权限声明
```

部署步骤（微信开发者工具）：
1. 打开项目，启用“云开发”
2. 右键 `cloudfunctions/login` 目录 -> “上传并部署：云端安装依赖（不上传 node_modules）”
3. 在“云开发控制台 -> 云函数”确认 `login` 部署成功
4. 本地小程序端即可通过 `Taro.cloud.callFunction({ name: 'login' })` 获取 `openid`


