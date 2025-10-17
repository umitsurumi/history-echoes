<!-- markdownlint-disable MD033 MD041 -->
<p align="center">
  <img src="./public/globe.svg" width="200" height="200" alt="History Echoes">
</p>

<div align="center">
  <!-- prettier-ignore-start -->
  <!-- markdownlint-disable-next-line MD036 -->
  <div>✨ 穿越时空迷雾，聆听历史的回响 ✨</div>
  <br/>
</div>

## 📜 介绍

**历史回响 (History Echoes)** 是一款基于 AI 驱动的在线历史人物竞猜游戏。项目使用 Next.js 15 (Turbopack) + React 19 + TypeScript 构建，通过与 AI 服务结合，为玩家提供富有挑战和趣味的解谜体验。

游戏会根据你设定的**时间范围**、**地域**和**难度**，由 AI 动态生成关于一位神秘历史人物的十条线索。你需要根据这些由难到易的线索，猜出这位伟人的真实身份。

~~项目为 Vibe Code 实践，代码仅供参考使用！~~

## ✨ 核心功能

* **智能谜题生成**：AI 会根据维基百科内容，动态生成高质量、从晦涩到清晰的十条线索，并自动获取人物简介与肖像。
* **自定义游戏体验**：玩家可以自由选择四大历史时期（古典时代、后古典时代、近代早期、近现代）、三大地域（亚洲、欧洲、美洲等）以及三种难度等级（简单、普通、困难）。
* **渐进式线索揭示**：游戏从最模糊的线索开始，逐步揭示更明确的信息。玩家可以在任何时刻提交答案，考验你的历史知识深度。
* **沉浸式游戏界面**：精心设计的用户界面和动画效果，营造出探索历史迷雾的神秘氛围。
* **持久化游戏设置**：自动保存你的游戏设置偏好，方便快速开始新的挑战。

## 🚀 快速开始

### 环境要求

* Node.js 18+
* PostgreSQL 数据库
* AI 提供商 API Key (用于生成线索)

### 安装依赖

```bash
npm install
```

### 环境配置

1. 复制 `env.example` 为 `.env` 并配置你的环境变量。

    ```bash
    cp env.example .env
    ```

2. 编辑 `.env` 文件，配置数据库连接和 AI 提供商信息：

    ```env
    # 数据库连接
    DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

    # AI 提供商配置 (示例)
    OPENAI_API_KEY="your-openai-api-key-here"
    OPENAI_API_BASE_URL="<https://api.deepseek.com/v1>"
    OPENAI_MODEL="deepseek-chat"
    OPENAI_MAX_TOKENS="8192"
    OPENAI_TEMPERATURE="0.5"
    ```

    > [!NOTE]  
    > MAX_TOKENS 配置过短时，可能出现回答截断不能生成完整 JSON 响应的情况。

### 数据库迁移

使用 Prisma 来初始化和同步你的数据库结构。

```bash
# 生成 Prisma Client
npx prisma generate

# 将 schema 推送到数据库
npx prisma db push
```

你也可以使用 `prisma studio` 来查看和管理你的数据库。

```bash
npx prisma studio
```

### 数据填充

为了获得完整的游戏体验，你可以导入项目提供的初始历史人物数据。

1. **连接到你的 PostgreSQL 数据库**。你可以使用任何你喜欢的数据库管理工具，例如 `psql`、DBeaver 或 TablePlus。

2. **执行 SQL 脚本**。将 [`docs/figure.sql`](docs/figure.sql) 文件中的内容复制并执行，即可将数百位预设的历史人物导入到你的 `Figure` 表中。

    > [!IMPORTANT]
    > `figure.sql` 脚本默认操作的表名为 `Figure`。如果你的 Prisma Schema 中定义的表名不同，请相应修改脚本。

### 运行开发服务器

```bash
npm run dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看应用。

### 构建生产版本

```bash
npm run build
npm run start
```

## 📁 项目结构

```bash
history-echoes/
├── docs/                     # 游戏文档
├── prisma/                   # Prisma Schema 定义
│   └── schema.prisma
├── public/                   # 静态资源
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── page.tsx          # 游戏主页
│   │   ├── game-setup/       # 游戏设置页
│   │   ├── game/             # 核心游戏页
│   │   ├── loading/          # 加载页
│   │   ├── error/            # 错误页
│   │   └── api/              # API 路由
│   │       ├── games/        # 游戏创建与交互 API
│   │       └── cleanup/      # 定期清理任务
│   ├── component/            # loading fallback组件
│   ├── lib/                  # 核心逻辑库
│   │   ├── ai-config.ts      # AI 服务配置
│   │   ├── ai-service.ts     # AI 服务集成
│   │   ├── wiki-service.ts   # 维基百科服务
│   │   ├── game-sessions.ts  # 游戏会话管理
│   │   ├── prisma.ts         # Prisma Client 实例
│   │   └── errors.ts         # 错误处理
│   └── types/                # TypeScript 类型声明
├── env.example               # 环境变量示例
└── ...
```
