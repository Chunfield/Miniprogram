const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const imagesCollection = db.collection('images')

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const imageId = event?.imageId || ''

  if (!OPENID) {
    return { error: 'UNAUTHORIZED', message: '请先登录' }
  }

  if (!imageId) {
    return { error: 'INVALID_IMAGE_ID', message: '缺少 imageId' }
  }

  try {
    const imageDoc = await imagesCollection.doc(imageId).get()
    if (!imageDoc.data) {
      return { error: 'NOT_FOUND', message: '图片不存在' }
    }

    if (imageDoc.data.userOpenId !== OPENID) {
      return { error: 'FORBIDDEN', message: '无权删除该图片' }
    }

    await imagesCollection.doc(imageId).remove()

    if (imageDoc.data.fileID) {
      try {
        await cloud.deleteFile({
          fileList: [imageDoc.data.fileID]
        })
      } catch (fileError) {
        console.warn('删除云存储文件失败', fileError)
      }
    }

    return { imageId, deleted: true }
  } catch (error) {
    console.error('deleteImage 云函数异常', error)
    return { error: 'DELETE_FAILED', message: error.message || '删除失败' }
  }
}

