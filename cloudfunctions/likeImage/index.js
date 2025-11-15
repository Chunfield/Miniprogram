const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const imagesCollection = db.collection('images')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const imageId = event?.imageId || ''
  const action = event?.action || 'like'

  if (!OPENID) {
    return { error: 'UNAUTHORIZED', message: '请先登录' }
  }

  if (!imageId) {
    return { error: 'INVALID_IMAGE_ID', message: '缺少 imageId' }
  }

  if (!['like', 'unlike'].includes(action)) {
    return { error: 'INVALID_ACTION', message: 'action 仅支持 like/unlike' }
  }

  try {
    const imageDoc = await imagesCollection.doc(imageId).get()
    if (!imageDoc.data) {
      return { error: 'NOT_FOUND', message: '图片不存在' }
    }

    const likeUsers = Array.isArray(imageDoc.data.likeUsers)
      ? imageDoc.data.likeUsers.slice()
      : []
    const hasLiked = likeUsers.includes(OPENID)
    let updatedLikes = imageDoc.data.likes || 0

    if (action === 'like' && !hasLiked) {
      likeUsers.push(OPENID)
      updatedLikes += 1
    } else if (action === 'unlike' && hasLiked) {
      const index = likeUsers.indexOf(OPENID)
      likeUsers.splice(index, 1)
      updatedLikes = Math.max(0, updatedLikes - 1)
    }

    await imagesCollection.doc(imageId).update({
      data: {
        likeUsers,
        likes: updatedLikes
      }
    })

    return {
      imageId,
      likes: updatedLikes,
      liked: likeUsers.includes(OPENID)
    }
  } catch (error) {
    console.error('likeImage 云函数异常', error)
    return { error: 'LIKE_FAILED', message: error.message || '操作失败' }
  }
}

