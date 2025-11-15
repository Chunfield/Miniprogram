## 云数据库初始化

在创建或重置云环境时，按以下说明在微信云开发控制台或使用 CLI 初始化集合与索引。

### 1. 创建集合

| 集合名 | 说明 |
| --- | --- |
| `users` | 存储用户信息与微信 `openId` |
| `images` | 存储发布的 AI 图片及其元数据 |

### 2. 字段结构

#### `users`
```json
{
  "openId": "string",
  "nickName": "string",
  "avatarUrl": "string",
  "createdAt": 0,
  "updatedAt": 0
}
```

#### `images`
```json
{
  "userId": "string",
  "userOpenId": "string",
  "imageUrl": "string",
  "prompt": "string",
  "likes": 0,
  "likeUsers": ["string"],
  "createdAt": 0,
  "_openid": "string"
}
```

### 3. 索引

在集合设置页添加以下索引：

| 集合 | 字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| `users` | `openId` | 唯一 | openId 唯一约束 |
| `images` | `userId` | 普通 | 个人画廊查询 |
| `images` | `createdAt` (DESC) | 普通 | 首页按时间排序 |

> CLI 示例（需要安装 `wxcloud` 工具）：
> ```bash
> wxcloud db:create-collection users
> wxcloud db:create-collection images
> wxcloud db:create-index users openId --unique
> wxcloud db:create-index images userId
> wxcloud db:create-index images createdAt --order desc
> ```

完成后即可继续部署云函数。

