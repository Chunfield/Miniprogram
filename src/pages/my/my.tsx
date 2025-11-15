import { useState } from 'react'
import { View, Image, ScrollView, Button } from '@tarojs/components'
import { useLoad, useDidShow, getUserProfile, useRouter, navigateTo, showToast, showModal } from '@tarojs/taro'
import { DEFAULT_FALLBACK_IMAGE, type GalleryItem } from '../../utils/api'
import { isLoggedIn, getUserInfo, fetchMyGallery, setUserInfo, logout, likeImage, deleteImage, clearGalleryCache, type UserInfo } from '../../utils/storage'
import { getOpenId, upsertUser } from '../../utils/cloud'
import './my.css'

export default function My() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [userInfo, setUserInfoState] = useState<UserInfo | null>(null)
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [nextPage, setNextPage] = useState(1)
  const router = useRouter()
  const redirect = decodeURIComponent(router.params?.redirect || '')
  const PAGE_SIZE = 20

  useLoad(() => {
    checkLoginStatus()
    refreshMyGallery()
  })

  useDidShow(() => {
    checkLoginStatus()
    if (isLoggedIn()) {
      refreshMyGallery()
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

  const refreshMyGallery = async () => {
    if (!isLoggedIn()) {
      setGallery([])
      return
    }
    setRefreshing(true)
    setHasMore(true)
    setNextPage(1)
    await loadMyGalleryPage(1, true)
  }

  const loadMyGalleryPage = async (page: number, forceRefresh = false) => {
    if (loading) return
    const currentUser = getUserInfo()
    const openId = currentUser?.openId
    if (!openId) {
      setRefreshing(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetchMyGallery({ page, pageSize: PAGE_SIZE, userOpenId: openId }, { forceRefresh })
      setGallery((prev) => (page === 1 ? res.items : [...prev, ...res.items]))
      const noMore = page * PAGE_SIZE >= res.total || res.items.length < PAGE_SIZE
      setHasMore(!noMore)
      setNextPage(page + 1)
    } catch (error) {
      console.error('加载个人画廊失败', error)
      showToast({ title: '加载失败，请稍后重试', icon: 'none' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  const handleImageError = (imageId: string) => {
    setGallery(prev =>
      prev.map(item => (item.imageId === imageId ? { ...item, imageUrl: DEFAULT_FALLBACK_IMAGE } : item))
    )
  }

  const handleScrollToLower = () => {
    if (!hasMore || loading) return
    loadMyGalleryPage(nextPage)
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
        refreshMyGallery()
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
        refreshMyGallery()
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
      refreshMyGallery()
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
    setGallery([])
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

  const handleLike = async (imageId: string, liked: boolean) => {
    try {
      const res = await likeImage(imageId, liked ? 'unlike' : 'like')
      setGallery((prev) =>
        prev.map((item) =>
          item.imageId === imageId ? { ...item, liked: res.liked, likes: res.likes } : item
        )
      )
    } catch (error) {
      console.error('点赞失败', error)
      showToast({ title: '操作失败', icon: 'none' })
    }
  }

  const handleDelete = async (imageId: string) => {
    const modal = await showModal({
      title: '删除作品',
      content: '确定要删除这幅作品吗？删除后不可恢复。',
      confirmText: '删除',
      cancelText: '取消'
    })
    if (!modal.confirm) return
    try {
      await deleteImage(imageId)
      clearGalleryCache()
      showToast({ title: '删除成功', icon: 'success' })
      refreshMyGallery()
    } catch (error) {
      console.error('删除失败', error)
      showToast({ title: '删除失败，请稍后重试', icon: 'none' })
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
        <ScrollView
          className='my-gallery-scroll'
          scrollY
          refresherEnabled
          refresherTriggered={refreshing}
          onRefresherRefresh={refreshMyGallery}
          lowerThreshold={120}
          onScrollToLower={handleScrollToLower}
        >
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
                  <View key={item.imageId} className='gallery-item'>
                    <Image
                      className='gallery-image'
                      src={item.imageUrl}
                      mode='aspectFill'
                      lazyLoad
                      onError={() => handleImageError(item.imageId)}
                    />
                    <View className='gallery-item-info'>
                      <View className='gallery-prompt'>{item.prompt}</View>
                      <View className='gallery-actions'>
                        <View
                          className={`like-button ${item.liked ? 'liked' : ''}`}
                          onClick={() => handleLike(item.imageId, item.liked)}
                        >
                          <View className='like-icon'>{item.liked ? '❤️' : '🤍'}</View>
                          <View className='like-count'>{item.likes}</View>
                        </View>
                        <Button
                          className='action-button delete'
                          size='mini'
                          onClick={() => handleDelete(item.imageId)}
                        >
                          删除
                        </Button>
                      </View>
                    </View>
                  </View>
                ))}
                {loading && <View className='loading-more'>加载中...</View>}
                {!hasMore && gallery.length > 0 && <View className='no-more'>已经到底啦</View>}
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  )
}

