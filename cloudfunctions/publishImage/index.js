const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const usersCollection = db.collection('users')
const imagesCollection = db.collection('images')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const prompt = (event?.prompt || '').trim()
  const fileID = event?.fileID || event?.imageFileId || ''
  const imageUrl = event?.imageUrl || ''

  if (!prompt) {
    return { error: 'INVALID_PROMPT', message: 'prompt 不能为空' }
  }

  if (!fileID && !imageUrl) {
    return { error: 'INVALID_IMAGE', message: '缺少图片文件信息' }
  }

  const now = Date.now()

  try {
    const userDoc = await ensureUser(OPENID, event)
    const record = {
      userId: userDoc?._id || null,
      userOpenId: OPENID,
      prompt,
      likes: 0,
      likeUsers: [],
      createdAt: now,
      fileID: fileID || '',
      imageUrl,
      status: 'published'
    }

    if (!record.imageUrl && record.fileID) {
      const tempUrl = await cloud.getTempFileURL({ fileList: [record.fileID] })
      record.imageUrl = tempUrl?.fileList?.[0]?.tempFileURL || ''
    }

    const addRes = await imagesCollection.add({ data: record })

    return {
      imageId: addRes._id,
      ...record
    }
  } catch (error) {
    console.error('publishImage 云函数异常', error)
    return { error: 'PUBLISH_FAILED', message: error.message || '发布失败，请稍后重试' }
  }
}

async function ensureUser(openId, event) {
  const existing = await usersCollection.where({ openId }).limit(1).get()
  if (existing.data.length > 0) {
    return existing.data[0]
  }

  const now = Date.now()
  const nickName = event?.nickName || '微信用户'
  const avatarUrl = event?.avatarUrl || ''
  const addRes = await usersCollection.add({
    data: {
      openId,
      nickName,
      avatarUrl,
      createdAt: now,
      updatedAt: now
    }
  })
  return {
    _id: addRes._id,
    openId,
    nickName,
    avatarUrl,
    createdAt: now,
    updatedAt: now
  }
}

