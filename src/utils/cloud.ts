import Taro from '@tarojs/taro'
import { type UserInfo } from './storage'

export const CLOUD_ENV_ID = 'cloud1-8ghvj56v09766859'

export function ensureCloudInited() {
  try {
    // @ts-ignore
    if (Taro.cloud && typeof Taro.cloud.init === 'function') {
      // @ts-ignore
      Taro.cloud.init({ env: CLOUD_ENV_ID })
    }
  } catch {}
}

export async function getOpenId(): Promise<string> {
  ensureCloudInited()
  try {
    // 需要部署云函数 login，返回 openid
    // { openid: string }
    // @ts-ignore
    const res = await Taro.cloud.callFunction({ name: 'login' })
    const openid = res?.result?.openid || res?.result?.openId || ''
    if (!openid) {
      throw new Error('云函数返回的 openid 为空')
    }
    return openid
  } catch (error) {
    console.error('调用云函数 login 失败:', error)
    throw new Error('云函数调用失败，请检查云开发环境配置')
  }
}

export async function upsertUser(user: UserInfo & { openId: string }) {
  ensureCloudInited()
  try {
    // @ts-ignore
    const db = Taro.cloud.database()
    const users = db.collection('users')
    // 以 openId 作为唯一键
    const { data } = await users.where({ openId: user.openId }).get()
    if (data && data.length > 0) {
      const docId = data[0]._id
      await users.doc(docId).update({
        data: {
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          updatedAt: Date.now()
        }
      })
      return { _id: docId, ...data[0], ...user }
    } else {
      const addRes = await users.add({
        data: {
          ...user,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      })
      return { _id: addRes._id, ...user }
    }
  } catch (error) {
    console.error('数据库操作失败:', error)
    throw new Error('保存用户信息失败，请检查云数据库配置')
  }
}


