import { useState } from 'react'
import { View, Textarea, Image, Button } from '@tarojs/components'
import { useLoad, navigateBack, navigateTo, showToast } from '@tarojs/taro'
import { generateImage, DEFAULT_FALLBACK_IMAGE } from '../../utils/api'
import { isLoggedIn, getUserInfo, addToHomeGallery, addToMyGallery, type GalleryItem } from '../../utils/storage'
import './create.css'

export default function Create() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const recommendPrompts = [
    '赛博朋克城市夜景，霓虹灯，雨夜，反射',
    '清晨的山谷薄雾，阳光穿透，宁静氛围',
    '梵高风格的向日葵花田，厚涂油画质感',
    '可爱的小猫戴着围巾坐在窗台，柔和光线',
    '中国水墨山水，云雾缭绕的仙境',
    '宇航员在月球上种一棵树，科幻与自然',
  ]

  useLoad(() => {
    // 页面加载时的初始化
  })

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      showToast({
        title: '请输入提示词',
        icon: 'none'
      })
      return
    }

    setLoading(true)
    setGeneratedImage(null)

    try {
      const imageUrl = await generateImage(prompt)
      setGeneratedImage(imageUrl)
    } catch (error) {
      console.error('生成图片失败:', error)
      showToast({
        title: '生成失败，请重试',
        icon: 'none'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = () => {
    if (!generatedImage || !prompt.trim()) {
      showToast({
        title: '请先生成图片',
        icon: 'none'
      })
      return
    }

    if (!isLoggedIn()) {
      showToast({
        title: '请先登录',
        icon: 'none'
      })
      // 跳转到我的页面登录
      setTimeout(() => {
        const redirect = encodeURIComponent('/pages/create/create')
        navigateTo({
          url: `/pages/my/my?redirect=${redirect}`
        })
      }, 1500)
      return
    }

    const userInfo = getUserInfo()
    const newItem: GalleryItem = {
      id: Date.now(),
      prompt: prompt.trim(),
      author: userInfo?.nickName || '用户',
      image: generatedImage,
      createdAt: Date.now()
    }

    // 添加到首页和我的画廊
    addToHomeGallery(newItem)
    addToMyGallery(newItem)

    showToast({
      title: '发布成功！',
      icon: 'success'
    })

    // 延迟跳转，让用户看到成功提示
    setTimeout(() => {
      navigateBack()
    }, 1500)
  }

  return (
    <View className='create-page'>
      <View className='create-header'>
        <View className='header-title'>🎨 创建图片</View>
        <View className='header-subtitle'>描述你想画的内容，AI会为你生成</View>
      </View>

      <View className='create-content'>
        <View className='prompt-input-container'>
          <View className='prompt-label'>提示词</View>
          <Textarea
            className='prompt-input'
            value={prompt}
            onInput={(e) => setPrompt(e.detail.value)}
            placeholder='例如：一只可爱的小猫咪在花园里玩耍，阳光明媚，风格温馨...'
            maxlength={500}
            showConfirmBar={false}
          />
          <View className='prompt-suggestions'>
            {recommendPrompts.map((p) => (
              <View
                key={p}
                className='prompt-chip'
                onClick={() => setPrompt(prev => prev ? `${prev} ${p}` : p)}
              >
                {p}
              </View>
            ))}
          </View>
        </View>

        <Button
          className='generate-button'
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
        >
          {loading ? '生成中...' : '生成图片'}
        </Button>

        {loading && (
          <View className='loading-container'>
            <View className='loading-spinner'></View>
            <View className='loading-text'>AI正在为你创作，请稍候...</View>
          </View>
        )}

        {generatedImage && !loading && (
          <View className='result-container'>
            <Image
              className='generated-image'
              src={generatedImage}
              mode='widthFix'
              onError={() => setGeneratedImage(DEFAULT_FALLBACK_IMAGE)}
            />
            <Button
              className='publish-button'
              onClick={handlePublish}
            >
              发布
            </Button>
          </View>
        )}
      </View>
    </View>
  )
}

