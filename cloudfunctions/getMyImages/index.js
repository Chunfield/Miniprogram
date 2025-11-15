const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const imagesCollection = db.collection('images')
const usersCollection = db.collection('users')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const targetOpenId = event?.userOpenId || OPENID

  if (!targetOpenId) {
    return { error: 'UNAUTHORIZED', message: '请先登录' }
  }

  const page = Math.max(1, parseInt(event?.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(event?.pageSize, 10) || 20))
  const skip = (page - 1) * pageSize

  try {
    const [imagesRes, totalRes, userRes] = await Promise.all([
      imagesCollection
        .where({ userOpenId: targetOpenId })
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get(),
      imagesCollection.where({ userOpenId: targetOpenId }).count(),
      usersCollection.where({ openId: targetOpenId }).limit(1).get()
    ])

    const author = userRes.data?.[0] || {}
    const items = (imagesRes.data || []).map((item) => {
      const likeUsers = Array.isArray(item.likeUsers) ? item.likeUsers : []
      const liked = likeUsers.includes(targetOpenId)
      return {
        imageId: item._id,
        prompt: item.prompt,
        imageUrl: item.imageUrl,
        fileID: item.fileID || '',
        likes: item.likes || 0,
        likeUsers,
        liked,
        createdAt: item.createdAt,
        author: {
          userId: item.userId || author._id || '',
          openId: author.openId || targetOpenId,
          nickName: author.nickName || '微信用户',
          avatarUrl: author.avatarUrl || ''
        }
      }
    })

    return {
      page,
      pageSize,
      total: totalRes?.total || 0,
      items
    }
  } catch (error) {
    console.error('getMyImages 云函数异常', error)
    return { error: 'MY_GALLERY_FAILED', message: error.message || '获取个人画廊失败' }
  }
}

