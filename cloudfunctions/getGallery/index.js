const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const imagesCollection = db.collection('images')
const usersCollection = db.collection('users')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const page = Math.max(1, parseInt(event?.page, 10) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(event?.pageSize, 10) || 20))
  const viewerOpenId = event?.userOpenId || OPENID || ''

  try {
    const skip = (page - 1) * pageSize
    const [listRes, totalRes] = await Promise.all([
      imagesCollection
        .orderBy('createdAt', 'desc')
        .skip(skip)
        .limit(pageSize)
        .get(),
      imagesCollection.count()
    ])

    const images = listRes.data || []
    const userIds = Array.from(
      new Set(
        images
          .map((item) => item.userId)
          .filter(Boolean)
      )
    )

    let userMap = {}
    if (userIds.length > 0) {
      const usersRes = await usersCollection
        .where({
          _id: db.command.in(userIds)
        })
        .get()
      userMap = usersRes.data.reduce((acc, cur) => {
        acc[cur._id] = cur
        return acc
      }, {})
    }

    const items = images.map((item) => {
      const author = userMap[item.userId] || {}
      const liked =
        !!viewerOpenId &&
        Array.isArray(item.likeUsers) &&
        item.likeUsers.includes(viewerOpenId)
      return {
        imageId: item._id,
        prompt: item.prompt,
        imageUrl: item.imageUrl,
        fileID: item.fileID || '',
        likes: item.likes || 0,
        liked,
        createdAt: item.createdAt,
        author: {
          userId: item.userId || '',
          openId: author.openId || item.userOpenId || '',
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
    console.error('getGallery 云函数异常', error)
    return {
      error: 'GALLERY_FAILED',
      message: error.message || '获取画廊失败'
    }
  }
}

