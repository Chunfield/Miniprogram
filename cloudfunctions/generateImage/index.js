const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const DEFAULT_PROVIDER = process.env.AI_IMAGE_PROVIDER || 'placeholder'
const PLACEHOLDER_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQCAQAAABJ0RK2AAAACXBIWXMAAAsTAAALEwEAmpwYAAAFHklEQVR4nO3VwQmEMBBF0b/5X7nAGZMqEBCkzuDU+PMd3UC+yL66zs7p6end3d3d3d3d3d3d3d3d3d3d3f1R71vQp7Zv+/P3XqvYJX+qJGXjlF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUV1Xx+8f/8B5td7c1V/N1/QfPa31nPbbWKX7Vy0PsUuYrXo9glcV70+wStiuej2CVxXvT7BK2K56PYJXFe9PsErYrnrdk8DTNf6Yv4apn7BFzX+GL+GqZ+wRc1/hi/hqmfsEXNf4Yv4apn7BFzX+GL+GqZ+wRc1/hi/hqmfsEXNf4Yv4apn7BFzX+GL+GqZ+wRc1/hi/hqmfsEXNf4Yv4apn7BFzX+GL+GqZ+wRc1/hi/hqmfsEXNf4Yv4apn7BFzX+GL+GqZ+wRc1/hi/hqmfsEXNf4Yv4apn7BFzX+GL+GqZ+wRc1/hhX9V6H2CVxXvT7BK2K56PYJXFe9PsErYrnq9wl8zh9Nv95vPcTv2x+6+7g91er+R1feqO2P+rj4V/VPevZx9+6JGXjlF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXili51ReKWLnVF4pYudUXil65x1P6F1sT2ljuYAAAAASUVORK5CYII='

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext()
  const prompt = (event?.prompt || '').trim()
  const provider = event?.provider || DEFAULT_PROVIDER

  if (!prompt) {
    return {
      error: 'INVALID_PROMPT',
      message: 'prompt 不能为空'
    }
  }

  try {
    const { buffer, mimeType } = await requestImageFromProvider({ prompt, provider })
    const fileExt = mimeType === 'image/png' ? 'png' : 'jpg'
    const cloudPath = `generated/${OPENID}/${Date.now()}_${Math.floor(Math.random() * 1e6)}.${fileExt}`
    const uploadRes = await cloud.uploadFile({
      cloudPath,
      fileContent: buffer
    })

    const fileID = uploadRes.fileID
    const tempRes = await cloud.getTempFileURL({
      fileList: [fileID]
    })
    const fileUrl = tempRes?.fileList?.[0]?.tempFileURL || ''

    return {
      provider,
      prompt,
      fileID,
      imageUrl: fileUrl,
      mimeType,
      cloudPath
    }
  } catch (error) {
    console.error('generateImage 云函数异常', error)
    return {
      error: 'GENERATE_FAILED',
      message: error.message || '生成失败，请稍后重试'
    }
  }
}

async function requestImageFromProvider({ prompt, provider }) {
  switch (provider) {
    case 'placeholder':
    default:
      return createPlaceholderImage()
  }
}

function createPlaceholderImage() {
  return {
    buffer: Buffer.from(PLACEHOLDER_IMAGE_BASE64, 'base64'),
    mimeType: 'image/png'
  }
}

