import Taro from '@tarojs/taro'
import { ensureCloudInited } from './cloud'

export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&q=80'

interface CloudCallOptions<T> {
  name: string
  data?: Record<string, any>
  transform?: (result: any) => T
}

async function callCloudFunction<T = any>({
  name,
  data,
  transform
}: CloudCallOptions<T>): Promise<T> {
  ensureCloudInited()
  try {
    // @ts-ignore
    const res = await Taro.cloud.callFunction({ name, data })
    const result = res?.result || {}
    if (result.error) {
      throw new Error(result.message || result.error)
    }
    return transform ? transform(result) : (result as T)
  } catch (error: any) {
    console.error(`[cloud:${name}] failed`, error)
    throw new Error(error?.message || '云函数调用失败')
  }
}

export interface GenerateImageResult {
  provider: string
  prompt: string
  fileID: string
  imageUrl: string
  mimeType: string
  cloudPath: string
}

export const callGenerateImage = (prompt: string, provider?: string) =>
  callCloudFunction<GenerateImageResult>({
    name: 'generateImage',
    data: { prompt, provider }
  })

export interface PublishImageParams {
  prompt: string
  fileID?: string
  imageUrl?: string
  nickName?: string
  avatarUrl?: string
}

export interface PublishImageResult {
  imageId: string
  prompt: string
  imageUrl: string
  fileID: string
  createdAt: number
  likes: number
}

export const callPublishImage = (params: PublishImageParams) =>
  callCloudFunction<PublishImageResult>({
    name: 'publishImage',
    data: params
  })

export interface GalleryItem {
  imageId: string
  prompt: string
  imageUrl: string
  fileID: string
  likes: number
  liked: boolean
  createdAt: number
  author: {
    userId: string
    openId: string
    nickName: string
    avatarUrl: string
  }
}

export interface GalleryResponse {
  page: number
  pageSize: number
  total: number
  items: GalleryItem[]
}

export const callGetGallery = (params: {
  page?: number
  pageSize?: number
  userOpenId?: string
}) =>
  callCloudFunction<GalleryResponse>({
    name: 'getGallery',
    data: params
  })

export interface MyGalleryResponse {
  page: number
  pageSize: number
  total: number
  items: Array<
    GalleryItem & {
      likeUsers: string[]
    }
  >
}

export const callGetMyImages = (params?: { page?: number; pageSize?: number; userOpenId?: string }) =>
  callCloudFunction<MyGalleryResponse>({
    name: 'getMyImages',
    data: params
  })

export const callLikeImage = (params: { imageId: string; action: 'like' | 'unlike' }) =>
  callCloudFunction<{ imageId: string; likes: number; liked: boolean }>({
    name: 'likeImage',
    data: params
  })

export const callDeleteImage = (params: { imageId: string }) =>
  callCloudFunction<{ imageId: string; deleted: boolean }>({
    name: 'deleteImage',
    data: params
  })

export const callGetUserInfo = () =>
  callCloudFunction<{
    openId: string
    appId: string
    unionId?: string
    user: {
      _id: string
      openId: string
      nickName: string
      avatarUrl: string
    } | null
  }>({
    name: 'getUserInfo'
  })

