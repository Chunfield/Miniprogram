const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

exports.main = async (event) => {
  const { OPENID, APPID, UNIONID } = cloud.getWXContext()

  if (!OPENID) {
    return { error: 'UNAUTHORIZED', message: '请先登录' }
  }

  try {
    const userRes = await usersCollection.where({ openId: OPENID }).limit(1).get()
    const userDoc = userRes.data?.[0] || null

    if (!userDoc && event?.autoCreate) {
      const now = Date.now()
      const nickName = event?.nickName || '微信用户'
      const avatarUrl = event?.avatarUrl || ''
      const addRes = await usersCollection.add({
        data: {
          openId: OPENID,
          nickName,
          avatarUrl,
          createdAt: now,
          updatedAt: now
        }
      })
      return {
        openId: OPENID,
        appId: APPID,
        unionId: UNIONID || '',
        user: {
          _id: addRes._id,
          openId: OPENID,
          nickName,
          avatarUrl,
          createdAt: now,
          updatedAt: now
        }
      }
    }

    return {
      openId: OPENID,
      appId: APPID,
      unionId: UNIONID || '',
      user: userDoc
    }
  } catch (error) {
    console.error('getUserInfo 云函数异常', error)
    return { error: 'GET_USER_FAILED', message: error.message || '获取用户信息失败' }
  }
}

