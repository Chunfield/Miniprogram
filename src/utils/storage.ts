import Taro from '@tarojs/taro'
import {
  callGetGallery,
  callGetMyImages,
  callLikeImage,
  callDeleteImage,
  type GalleryResponse,
  type MyGalleryResponse,
  type GalleryItem
} from './api'

const STORAGE_KEYS = {
  USER_INFO: 'userInfo',
  IS_LOGGED_IN: 'isLoggedIn',
  CACHE_PREFIX: 'galleryCache'
}

const CACHE_TTL = 5 * 60 * 1000 // 5分钟缓存

export interface UserInfo {
  nickName: string
  avatarUrl: string
  openId?: string
  _id?: string
}

interface CacheEntry<T> {
  data: T
  expiredAt: number
}

function buildCacheKey(key: string, params?: Record<string, any>) {
  if (!params || Object.keys(params).length === 0) return `${STORAGE_KEYS.CACHE_PREFIX}:${key}`
  return `${STORAGE_KEYS.CACHE_PREFIX}:${key}:${JSON.stringify(params)}`
}

function readCache<T>(key: string): T | null {
  try {
    const entry: CacheEntry<T> | undefined = Taro.getStorageSync(key)
    if (!entry) return null
    if (entry.expiredAt < Date.now()) {
      Taro.removeStorageSync(key)
      return null
    }
    return entry.data
  } catch {
    return null
  }
}

function writeCache<T>(key: string, data: T) {
  try {
    const entry: CacheEntry<T> = {
      data,
      expiredAt: Date.now() + CACHE_TTL
    }
    Taro.setStorageSync(key, entry)
  } catch (error) {
    console.warn('写入缓存失败', error)
  }
}

function invalidateCacheByPrefix(prefix: string) {
  try {
    const info = Taro.getStorageInfoSync()
    info.keys
      .filter((key) => key.startsWith(prefix))
      .forEach((key) => {
        Taro.removeStorageSync(key)
      })
  } catch (error) {
    console.warn('清理缓存失败', error)
  }
}

export async function fetchGallery(
  params: { page?: number; pageSize?: number; userOpenId?: string } = {},
  options: { forceRefresh?: boolean } = {}
): Promise<GalleryResponse> {
  const cacheKey = buildCacheKey('public', params)
  if (!options.forceRefresh) {
    const cached = readCache<GalleryResponse>(cacheKey)
    if (cached) {
      return cached
    }
  }
  const result = await callGetGallery(params)
  writeCache(cacheKey, result)
  return result
}

export async function fetchMyGallery(
  params: { page?: number; pageSize?: number; userOpenId?: string } = {},
  options: { forceRefresh?: boolean } = {}
): Promise<MyGalleryResponse> {
  const cacheKey = buildCacheKey('mine', params)
  if (!options.forceRefresh) {
    const cached = readCache<MyGalleryResponse>(cacheKey)
    if (cached) {
      return cached
    }
  }
  const result = await callGetMyImages(params)
  writeCache(cacheKey, result)
  return result
}

export async function likeImage(imageId: string, action: 'like' | 'unlike') {
  const result = await callLikeImage({ imageId, action })
  invalidateCacheByPrefix(`${STORAGE_KEYS.CACHE_PREFIX}:`)
  return result
}

export async function deleteImage(imageId: string) {
  const result = await callDeleteImage({ imageId })
  invalidateCacheByPrefix(`${STORAGE_KEYS.CACHE_PREFIX}:`)
  return result
}

export function clearGalleryCache() {
  invalidateCacheByPrefix(`${STORAGE_KEYS.CACHE_PREFIX}:`)
}

export function getUserInfo(): UserInfo | null {
  try {
    const data = Taro.getStorageSync(STORAGE_KEYS.USER_INFO)
    return data || null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

export function setUserInfo(userInfo: UserInfo): void {
  try {
    Taro.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
    Taro.setStorageSync(STORAGE_KEYS.IS_LOGGED_IN, true)
  } catch (error) {
    console.error('保存用户信息失败:', error)
  }
}

export function isLoggedIn(): boolean {
  try {
    return Taro.getStorageSync(STORAGE_KEYS.IS_LOGGED_IN) || false
  } catch (error) {
    return false
  }
}

export function logout(): void {
  try {
    Taro.removeStorageSync(STORAGE_KEYS.USER_INFO)
    Taro.removeStorageSync(STORAGE_KEYS.IS_LOGGED_IN)
    invalidateCacheByPrefix(`${STORAGE_KEYS.CACHE_PREFIX}:`)
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

export type { GalleryItem, GalleryResponse, MyGalleryResponse } from './api'
