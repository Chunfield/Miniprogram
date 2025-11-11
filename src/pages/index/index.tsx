import { useState } from 'react'
import { View, Image, ScrollView } from '@tarojs/components'
import { useLoad, useDidShow, navigateTo } from '@tarojs/taro'
import { getHomeGallery, type GalleryItem } from '../../utils/storage'
import { initDefaultGalleryData, DEFAULT_FALLBACK_IMAGE } from '../../utils/api'
import './index.css'

export default function Index() {
  const [gallery, setGallery] = useState<GalleryItem[]>([])

  useLoad(() => {
    // 初始化默认数据
    initDefaultGalleryData()
    // 加载画作列表
    loadGallery()
  })

  // 页面显示时刷新数据（从创建页面返回时）
  useDidShow(() => {
    loadGallery()
  })

  const loadGallery = () => {
    const data = getHomeGallery()
    setGallery(data)
  }

  const handleCreate = () => {
    navigateTo({
      url: '/pages/create/create'
    })
  }
  
  const handleImageError = (id: number) => {
    setGallery(prev =>
      prev.map(item => (item.id === id ? { ...item, image: DEFAULT_FALLBACK_IMAGE } : item))
    )
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
      >
        <View className='gallery-grid'>
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
                <View className='gallery-author'>
                  <View className='author-avatar'></View>
                  <View className='author-name'>{item.author}</View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <View className='fab' onClick={handleCreate}>
        <View className='fab-icon'>+</View>
      </View>
    </View>
  )
}
