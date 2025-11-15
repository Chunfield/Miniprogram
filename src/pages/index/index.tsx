import { useState } from 'react'
import { View, Image, ScrollView } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo, showToast } from '@tarojs/taro'
import { DEFAULT_FALLBACK_IMAGE } from '../../utils/api'
import { fetchGallery, likeImage } from '../../utils/storage'
import type { GalleryItem } from '../../utils/api'
import './index.css'

export default function Index() {
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [nextPage, setNextPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 20

  useLoad(() => {
    refreshGallery()
  })

  // 页面显示时刷新数据（从创建页面返回时）
  useDidShow(() => {
    refreshGallery()
  })

  const refreshGallery = async () => {
    setRefreshing(true)
    setHasMore(true)
    setNextPage(1)
    await loadGalleryPage(1, true)
  }

  const loadGalleryPage = async (page: number, forceRefresh = false) => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetchGallery({ page, pageSize: PAGE_SIZE }, { forceRefresh })
      setGallery((prev) => (page === 1 ? res.items : [...prev, ...res.items]))
      const noMore = page * PAGE_SIZE >= res.total || res.items.length < PAGE_SIZE
      setHasMore(!noMore)
      setNextPage(page + 1)
    } catch (error) {
      console.error('加载画廊失败', error)
      showToast({
        title: '加载失败，请稍后重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleCreate = () => {
    navigateTo({
      url: '/pages/create/create'
    })
  }

  const handleImageError = (imageId: string) => {
    setGallery(prev =>
      prev.map(item => (item.imageId === imageId ? { ...item, imageUrl: DEFAULT_FALLBACK_IMAGE } : item))
    )
  }

  const handleScrollToLower = () => {
    if (loading || !hasMore) return
    loadGalleryPage(nextPage)
  }

  const handleLike = async (imageId: string, liked: boolean) => {
    try {
      const result = await likeImage(imageId, liked ? 'unlike' : 'like')
      setGallery((prev) =>
        prev.map((item) =>
          item.imageId === imageId
            ? { ...item, liked: result.liked, likes: result.likes }
            : item
        )
      )
    } catch (error) {
      console.error('点赞失败', error)
      showToast({ title: '操作失败，请稍后重试', icon: 'none' })
    }
  }

  return (
    <View className='index-page'>
      <View className='home-header'>
        <View className='header-title'>🎨 AI生图</View>
        <View className='header-subtitle'>看大家的画</View>
      </View>
      <ScrollView
        className='gallery-scroll'
        scrollY
        enableBackToTop
        refresherEnabled
        refresherTriggered={refreshing}
        onRefresherRefresh={refreshGallery}
        lowerThreshold={100}
        onScrollToLower={handleScrollToLower}
      >
        <View className='gallery-grid'>
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
                <View className='gallery-author'>
                  <View className='author-avatar'></View>
                  <View className='author-name'>{item.author.nickName}</View>
                  <View
                    className={`like-button ${item.liked ? 'liked' : ''}`}
                    onClick={() => handleLike(item.imageId, item.liked)}
                  >
                    <View className='like-icon'>{item.liked ? '❤️' : '🤍'}</View>
                    <View className='like-count'>{item.likes}</View>
                  </View>
                </View>
              </View>
            </View>
          ))}
          {!loading && gallery.length === 0 && (
            <View className='empty-state'>
              <View className='empty-icon'>🖼️</View>
              <View className='empty-text'>暂无作品，快去创建吧！</View>
            </View>
          )}
          {loading && (
            <View className='loading-more'>加载中...</View>
          )}
          {!hasMore && gallery.length > 0 && (
            <View className='no-more'>已经到底啦</View>
          )}
        </View>
      </ScrollView>
      <View className='fab' onClick={handleCreate}>
        <View className='fab-icon'>+</View>
      </View>
    </View>
  )
}
