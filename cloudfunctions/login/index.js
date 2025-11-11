// 云函数入口文件
const cloud = require('wx-server-sdk')

// 使用当前环境
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID, APPID, UNIONID, ENV } = cloud.getWXContext()
  return {
    openid: OPENID,
    appid: APPID,
    unionid: UNIONID || '',
    env: ENV
  }
}


