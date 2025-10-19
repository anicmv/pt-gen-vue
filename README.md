# PT Gen Vue

基于 Vue 3 + TypeScript + Cloudflare Workers 的 PT 站点简介生成工具

## ✨ 功能特性

- 🎬 支持豆瓣电影/电视剧数据抓取
- 🔍 支持豆瓣移动端搜索接口
- 📺 支持 Bangumi 番组数据
- 🚀 基于 Cloudflare Workers 部署，全球加速
- 💾 支持 KV 缓存，提升响应速度
- 🎨 现代化 Vue 3 + Tailwind CSS 界面

## 📦 技术栈

- **前端**: Vue 3 + TypeScript + Tailwind CSS
- **后端**: Cloudflare Workers
- **构建工具**: Vite
- **包管理**: pnpm

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/anicmv/pt-gen-vue.git
cd pt-gen-vue
pnpm install
```

### 2. 配置 Cloudflare KV（必需）

#### 2.1 创建 KV Namespace

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **KV**
3. 点击 **Create a namespace**
4. 输入名称（如 `PT_GEN_STORE`）
5. 复制生成的 **Namespace ID**

#### 2.2 修改配置文件

复制配置文件模板：

```bash
cp wrangler.jsonc.example wrangler.jsonc
```

编辑 `wrangler.jsonc`，填入你的 KV Namespace ID：

```jsonc
{
  "kv_namespaces": [
    {
      "binding": "PT_GEN_STORE",
      "id": "你的KV_NAMESPACE_ID"  // 替换为实际的 ID
    }
  ]
}
```

### 3. 本地开发

```bash
pnpm dev
```

访问 `http://localhost:5173` 即可使用。

### 4. 部署到 Cloudflare

```bash
pnpm run deploy
```

部署成功后，你会得到一个 `*.workers.dev` 的访问地址。

## ⚙️ 可选配置

### 数据保存功能

如果需要将豆瓣数据保存到外部 API，可以配置以下环境变量。

#### 生产环境（推荐）

使用 Cloudflare Secrets（加密存储）：

```bash
# 更新 wrangler 到最新版本
pnpm add -D wrangler@latest

# 设置 API URL
pnpm wrangler secret put SAVE_API_URL --name pt-gen-vue
# 输入: https://your-api-url.com/save

# 设置 API Token
pnpm wrangler secret put SAVE_API_TOKEN --name pt-gen-vue
# 输入: your_token_here
```

#### 本地开发

创建 `.dev.vars` 文件（已在 `.gitignore` 中）：

```bash
SAVE_API_URL=https://your-api-url.com/save
SAVE_API_TOKEN=your_token_here
```

> ⚠️ **注意**: 不要将 `.dev.vars` 提交到 Git！

如果不配置这两个变量，数据保存功能将被禁用，不影响正常使用。

## 📖 使用说明

### 搜索功能

1. 在输入框中输入电影/电视剧名称
2. 点击"搜索"按钮
3. 从搜索结果中选择目标条目

### 直接查询

1. 在输入框中粘贴豆瓣链接（如 `https://movie.douban.com/subject/1292052/`）
2. 点击"查询"按钮
3. 自动生成格式化的简介信息

### 支持的链接格式

- 豆瓣电影: `https://movie.douban.com/subject/{id}/`
- Bangumi: `https://bgm.tv/subject/{id}/`

## 🔧 开发命令

```bash
# 安装依赖
pnpm install

# 本地开发
pnpm dev

# 构建项目
pnpm build

# 预览构建结果
pnpm preview

# 部署到 Cloudflare
pnpm run deploy

# 生成 Cloudflare Workers 类型
pnpm run cf-typegen

# 代码检查
pnpm lint
```

## 📁 项目结构

```
pt-gen-vue/
├── api/                    # Cloudflare Workers 后端
│   ├── config/            # 配置文件
│   │   └── domain.ts      # 支持的域名正则
│   ├── lib/               # 核心库
│   │   ├── common.ts      # 公共函数
│   │   ├── douban.ts      # 豆瓣数据源
│   │   ├── doubanMobile.ts # 豆瓣移动端
│   │   └── bangumi.ts     # Bangumi 数据源
│   ├── type/              # TypeScript 类型定义
│   └── index.ts           # Workers 入口
├── src/                   # Vue 前端
│   ├── App.vue            # 主组件
│   ├── main.ts            # 入口文件
│   └── assets/            # 静态资源
├── wrangler.jsonc         # Cloudflare Workers 配置
└── package.json           # 项目配置
```

## 🔒 安全说明

### 敏感信息保护

以下文件包含敏感信息，**不应提交到 Git**：

- `wrangler.jsonc` - 包含 KV Namespace ID
- `.dev.vars` - 包含本地开发的 API Token
- `.wrangler/` - Cloudflare 本地缓存

这些文件已在 `.gitignore` 中配置。

### 配置文件模板

项目提供了以下模板文件供参考：

- `wrangler.jsonc.example` - Workers 配置模板
- `.dev.vars.example` - 本地环境变量模板

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 许可证

本项目基于 MIT 许可证开源。

## 🙏 致谢

- 原项目: [Rhilip/pt-gen-cfworker](https://github.com/Rhilip/pt-gen-cfworker)
- 数据来源: 豆瓣电影、Bangumi

## 📮 联系方式

如有问题或建议，欢迎：

- 提交 [Issue](https://github.com/anicmv/pt-gen-vue/issues)
---

**⭐ 如果这个项目对你有帮助，请给个 Star！**

