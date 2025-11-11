import Taro from '@tarojs/taro'

// 模拟AI生成图片的API
// 实际开发中应该调用真实的AI生图API
export async function generateImage(prompt: string): Promise<string> {
  const FALLBACK_IMAGE = DEFAULT_FALLBACK_IMAGE
  return new Promise((resolve) => {
    // 模拟API调用延迟
    setTimeout(() => {
      // 使用Unsplash随机图片模拟AI生成的图片
      const randomSeed = Math.floor(Math.random() * 1000)
      const imageTypes = [
        'abstract', 'nature', 'city', 'art', 'technology',
        'animals', 'landscape', 'architecture', 'space', 'fantasy'
      ]
      const randomType = imageTypes[Math.floor(Math.random() * imageTypes.length)]
      const imageUrl = `https://source.unsplash.com/400x400/?${randomType}&sig=${randomSeed}`
      // 校验图片可用性，失败使用兜底图
      Taro.getImageInfo({ src: imageUrl })
        .then(() => resolve(imageUrl))
        .catch(() => resolve(FALLBACK_IMAGE))
    }, 2000) // 模拟2秒延迟
  })
}

// 导出兜底图，供页面或其他模块复用
export const DEFAULT_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop&q=80'

// 初始化默认数据
export function initDefaultGalleryData() {
  const homeGallery = Taro.getStorageSync('homeGallery')
  if (!homeGallery || homeGallery.length === 0) {
    const defaultGallery = [
      {
        id: 1,
        prompt: '一只可爱的小猫咪在花园里玩耍',
        author: '用户A',
        image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=400&fit=crop&q=80',
        createdAt: Date.now() - 86400000 * 6
      },
      {
        id: 2,
        prompt: '未来城市的夜景，霓虹灯闪烁',
        author: '用户B',
        image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop&q=80',
        createdAt: Date.now() - 86400000 * 5
      },
      {
        id: 3,
        prompt: '山水画风格的中国传统建筑',
        author: '用户C',
        image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&h=400&fit=crop&q=80',
        createdAt: Date.now() - 86400000 * 4
      },
      {
        id: 4,
        prompt: '科幻风格的机器人战士',
        author: '用户D',
        image: 'https://images.unsplash.com/photo-1509491750298-661d7a0c5e8f?w=400&h=400&fit=crop&q=80',
        createdAt: Date.now() - 86400000 * 3
      },
      {
        id: 5,
        prompt: '日式风格的樱花街道',
        author: '用户E',
        image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=400&fit=crop&q=80',
        createdAt: Date.now() - 86400000 * 2
      },
      {
        id: 6,
        prompt: '抽象艺术风格的色彩碰撞',
        author: '用户F',
        image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=400&fit=crop&q=80',
        createdAt: Date.now() - 86400000
      }
    ]
    // 先写入默认数据
    Taro.setStorageSync('homeGallery', defaultGallery)
    // 异步校验图片可用性，失败则替换为兜底图并回写
    Promise.allSettled(
      defaultGallery.map((item) =>
        Taro.getImageInfo({ src: item.image }).then(
          () => ({ ok: true, id: item.id }),
          () => ({ ok: false, id: item.id })
        )
      )
    ).then((results) => {
      const failedIds = new Set(
        results
          .filter((r) => r.status === 'fulfilled' && (r as any).value.ok === false)
          .map((r: any) => r.value.id)
      )
      if (failedIds.size > 0) {
        const fixed = defaultGallery.map((it) =>
          failedIds.has(it.id) ? { ...it, image: DEFAULT_FALLBACK_IMAGE } : it
        )
        Taro.setStorageSync('homeGallery', fixed)
      }
    })
  }
}

