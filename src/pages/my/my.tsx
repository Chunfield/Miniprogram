import { useState } from 'react'
import { View, Image, ScrollView, Button } from '@tarojs/components'
import { useLoad, useDidShow, getUserProfile, useRouter, navigateTo, showToast } from '@tarojs/taro'
import { DEFAULT_FALLBACK_IMAGE } from '../../utils/api'
import { isLoggedIn, getUserInfo, getMyGallery, setUserInfo, logout, type GalleryItem, type UserInfo } from '../../utils/storage'
import { getOpenId, upsertUser } from '../../utils/cloud'
import './my.css'

export default function My() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null)
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const router = useRouter()
  const redirect = decodeURIComponent(router.params?.redirect || '')

  useLoad(() => {
    checkLoginStatus()
    loadMyGallery()
  })

  useDidShow(() => {
    checkLoginStatus()
    if (isLoggedIn()) {
      loadMyGallery()
    }
  })

  const checkLoginStatus = () => {
    const loginStatus = isLoggedIn()
    setLoggedIn(loginStatus)
    if (loginStatus) {
      const info = getUserInfo()
      setUserInfoState(info)
    }
  }

  const loadMyGallery = () => {
    const data = getMyGallery()
    setGallery(data)
  }
  
  const handleImageError = (id: number) => {
    setGallery(prev =>
      prev.map(item => (item.id === id ? { ...item, image: DEFAULT_FALLBACK_IMAGE } : item))
    )
  }

  const handleLogin = async () => {
    try {
      const res = await getUserProfile({
        desc: '用于完善用户资料'
      })
      const infoBase: UserInfo = {
        nickName: res.userInfo.nickName || '微信用户',
        avatarUrl: res.userInfo.avatarUrl || ''
      }
      // 真实登录：获取 openId 并入库
      try {
        const openId = await getOpenId()
        const finalUser = { ...infoBase, openId }
        await upsertUser({ ...finalUser, openId })
        setUserInfo(finalUser)
        setUserInfoState(finalUser)
        setLoggedIn(true)
        showToast({ title: '登录成功', icon: 'success' })
        postLoginRedirect()
      } catch (cloudError) {
        console.error('云开发登录失败:', cloudError)
        // 云函数调用失败时，降级到本地登录（保持兼容性）
        showToast({ 
          title: '云服务暂不可用，使用本地登录', 
          icon: 'none',
          duration: 2000
        })
        setUserInfo(infoBase)
        setUserInfoState(infoBase)
        setLoggedIn(true)
        postLoginRedirect()
      }
    } catch (error) {
      console.error('登录失败:', error)
      // 如果用户拒绝授权，使用默认信息
      const defaultUserInfo: UserInfo = {
        nickName: '微信用户' + Math.floor(Math.random() * 10000),
        avatarUrl: ''
      }
      setUserInfo(defaultUserInfo)
      setUserInfoState(defaultUserInfo)
      setLoggedIn(true)
      showToast({ title: '已登录（本地模式）', icon: 'success' })
      postLoginRedirect()
    }
  }
  
  const handleLogout = () => {
    try {
      logout()
    } catch (e) {
      console.warn('清理本地登录状态失败', e)
    }
    setLoggedIn(false)
    setUserInfoState(null)
    showToast({ title: '已退出登录', icon: 'success' })
  }
  
  // 模拟一键登录（不弹授权）
  const handleLoginSimulated = () => {
    const defaultUserInfo: UserInfo = {
      nickName: '微信用户' + Math.floor(Math.random() * 10000),
      avatarUrl: ''
    }
    setUserInfo(defaultUserInfo)
    setUserInfoState(defaultUserInfo)
    setLoggedIn(true)
    showToast({ title: '已登录（模拟）', icon: 'success' })
    postLoginRedirect()
  }
  
  const postLoginRedirect = () => {
    if (redirect) {
      setTimeout(() => {
        navigateTo({ url: redirect })
      }, 300)
    }
  }

  return (
    <View className='my-page'>
      <View className='profile-header'>
        {!loggedIn ? (
          <View className='profile-not-logged-in'>
            <View className='welcome-text'>欢迎使用AI生图</View>
            <Button
              className='login-button'
              onClick={handleLogin}
            >
              微信一键登录
            </Button>
            <View style={{ height: '24rpx' }} />
            <Button
              className='login-button'
              onClick={handleLoginSimulated}
            >
              一键登录（模拟）
            </Button>
          </View>
        ) : (
          <View className='profile-logged-in'>
            <Image
              className='profile-avatar'
              src={userInfo?.avatarUrl || ''}
              mode='aspectFill'
            />
            <View className='profile-info'>
              <View className='profile-name'>{userInfo?.nickName || '用户'}</View>
              <View className='profile-desc'>我的个人画廊</View>
            </View>
            <View style={{ marginLeft: 'auto' }}>
              <Button className='login-button' onClick={handleLogout}>
                退出登录
              </Button>
            </View>
          </View>
        )}
      </View>
      {loggedIn && (
        <ScrollView className='my-gallery-scroll' scrollY>
          <View className='my-gallery-section'>
            <View className='section-title'>个人画廊</View>
            {gallery.length === 0 ? (
              <View className='empty-state'>
                <View className='empty-icon'>🖼️</View>
                <View className='empty-text'>还没有发布过作品</View>
                <View className='empty-text'>快去创作吧！</View>
                <View style={{ height: '32rpx' }} />
                <Button
                  className='login-button'
                  onClick={() => navigateTo({ url: '/pages/create/create' })}
                >
                  去创建作品
                </Button>
              </View>
            ) : (
              <View className='my-gallery-grid'>
                {gallery.map((item) => (
                  <View key={item.id} className='gallery-item'>
                    <Image
                      className='gallery-image'
                      src={item.image}
                      mode='aspectFill'
                      lazyLoad
                      onError={() => handleImageError(item.id)}
                    />
                    <View className='gallery-item-info'>
                      <View className='gallery-prompt'>{item.prompt}</View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

