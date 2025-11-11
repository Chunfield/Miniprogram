import Taro from '@tarojs/taro'

// 存储键名
const STORAGE_KEYS = {
  HOME_GALLERY: 'homeGallery',
  MY_GALLERY: 'myGallery',
  USER_INFO: 'userInfo',
  IS_LOGGED_IN: 'isLoggedIn'
}

// 画作数据类型
export interface GalleryItem {
  id: number
  prompt: string
  author: string
  image: string
  createdAt: number
}

// 用户信息类型
export interface UserInfo {
  nickName: string
  avatarUrl: string
  openId?: string
}

// 获取首页画作列表
export function getHomeGallery(): GalleryItem[] {
  try {
    const data = Taro.getStorageSync(STORAGE_KEYS.HOME_GALLERY)
    return data || []
  } catch (error) {
    console.error('获取首页画作失败:', error)
    return []
  }
}

// 保存首页画作列表
export function setHomeGallery(gallery: GalleryItem[]): void {
  try {
    Taro.setStorageSync(STORAGE_KEYS.HOME_GALLERY, gallery)
  } catch (error) {
    console.error('保存首页画作失败:', error)
  }
}

// 添加画作到首页
export function addToHomeGallery(item: GalleryItem): void {
  const gallery = getHomeGallery()
  gallery.unshift(item)
  setHomeGallery(gallery)
}

// 获取我的画廊
export function getMyGallery(): GalleryItem[] {
  try {
    const data = Taro.getStorageSync(STORAGE_KEYS.MY_GALLERY)
    return data || []
  } catch (error) {
    console.error('获取我的画廊失败:', error)
    return []
  }
}

// 保存我的画廊
export function setMyGallery(gallery: GalleryItem[]): void {
  try {
    Taro.setStorageSync(STORAGE_KEYS.MY_GALLERY, gallery)
  } catch (error) {
    console.error('保存我的画廊失败:', error)
  }
}

// 添加画作到我的画廊
export function addToMyGallery(item: GalleryItem): void {
  const gallery = getMyGallery()
  gallery.unshift(item)
  setMyGallery(gallery)
}

// 获取用户信息
export function getUserInfo(): UserInfo | null {
  try {
    const data = Taro.getStorageSync(STORAGE_KEYS.USER_INFO)
    return data || null
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return null
  }
}

// 保存用户信息
export function setUserInfo(userInfo: UserInfo): void {
  try {
    Taro.setStorageSync(STORAGE_KEYS.USER_INFO, userInfo)
    Taro.setStorageSync(STORAGE_KEYS.IS_LOGGED_IN, true)
  } catch (error) {
    console.error('保存用户信息失败:', error)
  }
}

// 检查是否已登录
export function isLoggedIn(): boolean {
  try {
    return Taro.getStorageSync(STORAGE_KEYS.IS_LOGGED_IN) || false
  } catch (error) {
    return false
  }
}

// 退出登录
export function logout(): void {
  try {
    Taro.removeStorageSync(STORAGE_KEYS.USER_INFO)
    Taro.removeStorageSync(STORAGE_KEYS.IS_LOGGED_IN)
  } catch (error) {
    console.error('退出登录失败:', error)
  }
}

