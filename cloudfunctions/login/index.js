const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')

/**
 * event 参数约定：
 * {
 *   nickName?: string,
 *   avatarUrl?: string
 * }
 */
exports.main = async (event) => {
  const { OPENID, APPID, UNIONID, ENV } = cloud.getWXContext()
  const now = Date.now()
  const nickName = event?.nickName || '微信用户'
  const avatarUrl = event?.avatarUrl || ''

  try {
    const existing = await usersCollection.where({ openId: OPENID }).limit(1).get()
    let userDoc

    if (existing.data.length > 0) {
      const docId = existing.data[0]._id
      await usersCollection.doc(docId).update({
        data: {
          nickName,
          avatarUrl,
          updatedAt: now
        }
      })
      userDoc = { ...existing.data[0], nickName, avatarUrl, updatedAt: now }
    } else {
      const addRes = await usersCollection.add({
        data: {
          openId: OPENID,
          nickName,
          avatarUrl,
          createdAt: now,
          updatedAt: now
        }
      })
      userDoc = {
        _id: addRes._id,
        openId: OPENID,
        nickName,
        avatarUrl,
        createdAt: now,
        updatedAt: now
      }
    }

    return {
      openId: OPENID,
      appId: APPID,
      unionId: UNIONID || '',
      env: ENV,
      user: userDoc
    }
  } catch (error) {
    console.error('login 云函数异常', error)
    return {
      openId: OPENID,
      appId: APPID,
      unionId: UNIONID || '',
      env: ENV,
      user: null,
      error: error.message || 'UNKNOWN_ERROR'
    }
  }
}
