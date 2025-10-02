# 实现细节

## API设计

游戏会话: 从用户点击“开始游戏”到游戏结束（猜对、用尽机会或放弃）的整个过程，由一个唯一的 `gameId` 标识。

### 开始新游戏

功能: 根据用户选择的设置创建一个新的游戏会话，从数据库或通过 AI 生成谜题，并返回游戏的初始状态及第一条线索。

- 路径: `/api/games`
- HTTP Method: `POST`

- 请求参数
  - 请求体:

    ```json
    {
    "timePeriod": "EARLY_MODERN",
    "region": "EUROPE",
    "difficulty": "NORMAL"  
    }
    ```

  - 参数枚举值：
    - `timePeriod` (string): `"CLASSICAL"` | `"POST_CLASSICAL"` | `"EARLY_MODERN"` | `"MODERN"`
    - `region` (string): `"ASIA"` | `"EUROPE"` | `"AMERICAS"` | `"OTHER"`
    - `difficulty` (string): `"EASY"` | `"NORMAL"` | `"HARD"`

- 响应参数
  - 状态码: `201 Created`
  - 响应体:

    ```json
    {
    "gameId": "a1b2c3d4-e5f6-7890-1234-567890abcdef", // string, 唯一的游戏会话ID
    "revealedClues": [ // string[], 已揭示的线索列表（初始只有一条）
        "关于我早年对炼金术的痴迷鲜为人知。"
    ],
    "currentClueIndex": 0, // number, 当前线索的索引 (0-based)
    "totalClues": 10 // number, 总线索数
    }
    ```

- 响应错误码
  - `400 Bad Request`: 请求体参数缺失或无效（例如，`difficulty` 的值不在预设选项中）。

    ```json
    { "error": "Invalid request parameters. 'difficulty' must be one of 'EASY', 'NORMAL', 'HARD'."}
    ```

  - `503 Service Unavailable`: 后端调用 AI 服务失败（在重试后仍然失败）或数据库连接失败，无法生成谜题。

    ```json
    { "error": "谜题生成服务暂时不可用，请稍后再试。" }
    ```

---

### 查询当前游戏

根据游戏ID，返回仍然在进行中的游戏会话信息。

- 路径: `/api/games/{gameId}`
- HTTP Method: `GET`
- 请求参数:
  - 路径参数:
    - `{gameId}`: 游戏会话 ID。

- 响应参数
  - 状态码: `200 OK`
  - 响应体:

      ```json
      {
          "gameId": "a1b2c3d4-e5f6-7890-1234-567890abcdef", // string, 唯一的游戏会话ID
          "revealedClues": [ // 返回包含新线索在内的所有已揭示线索
          "关于我早年对炼金术的痴迷鲜为人知。",
          "我曾用自制的仪器进行了大量光学实验。"
          ],
          "currentClueIndex": 1 // 当前最新一条提示的索引
      }
      ```

- 响应错误码
  - `404 Not Found`: 提供的 `gameId` 无效或游戏已结束（状态不为`ACTIVE`）。

    ```json
    { "error": "Game session not found or has already ended." }
    ```

---

### 提交答案

功能: 接收用户对某个游戏会话的猜测答案，进行校验并返回结果。如果错误，则返回下一条线索；如果正确或机会用尽，则结束游戏并返回最终谜底。

- 路径: `/api/games/{gameId}/guess`
- HTTP Method: `POST`
- 请求参数
  - 请求体:

    ```json
    {
      "guess": "艾萨克·牛顿" // string, 必选. 用户提交的答案
    }
    ```

  - 路径参数:
    - `{gameId}`: 对应要提交答案的游戏会话 ID。

- 响应参数
  - 状态码: `200 OK`
  - 响应体:
    - 情况 A: 答案正确

        ```json
        {
            "status": "CORRECT", // "CORRECT" | "INCORRECT" | "GAME_OVER"
            "figure": {
                "name": "艾萨克·牛顿",
                "summary": "一位英国物理学家、数学家、天文学家、自然哲学家和炼金术士...",
                "imageUrl": "https://example.com/path/to/newton.jpg",
                "sourceURL": "https://en.wikipedia.org/wiki/Isaac_Newton"
            },
            "allClues": [ // string[], 公布所有10条线索
                "关于我早年对炼金术的痴迷鲜为人知。",
                "...",
                "据说，一颗苹果的坠落给了我最伟大的灵感。"
            ],
            "currentClueIndex": 0 // 正确猜中的问题索引
        }
        ```

    - 情况 B: 答案错误，且仍有线索

        ```json
        {
            "status": "INCORRECT",
            "revealedClues": [ // 返回包含新线索在内的所有已揭示线索
            "关于我早年对炼金术的痴迷鲜为人知。",
            "我曾用自制的仪器进行了大量光学实验。"
            ],
            "currentClueIndex": 1 // 当前最新一条提示的索引
        }
        ```

    - 情况 C: 答案错误，且这是最后一次机会

        ```json
        {
            "status": "GAME_OVER",
            "figure": { // 同样公布谜底信息
                "name": "艾萨克·牛顿",
                "summary": "一位英国物理学家...",
                "imageUrl": "https://example.com/path/to/newton.jpg",
                "sourceURL": "https://en.wikipedia.org/wiki/Isaac_Newton"
            },
            "allClues": [ // string[], 公布所有10条线索
                "...",
                "..."
            ],
            "currentClueIndex": -1 // 固定为-1
        }
        ```

- 响应错误码
  - `404 Not Found`: 提供的 `gameId` 无效或游戏已结束。

    ```json
    { "error": "Game session not found or has already ended." }
    ```

  - `400 Bad Request`: 请求体缺少 `guess` 字段。

    ```json
    { "error": "Request body must include a 'guess' field." }
    ```

---

### 主动放弃游戏

功能: 允许用户在任何时候提前结束游戏，并获取谜底。

- 路径:`/api/games/{gameId}/abandon`
- HTTP Method: `POST`
- 请求参数:
  - 路径参数:
    - `{gameId}`: 对应要放弃的游戏会话 ID。

- 响应参数
  - 状态码: `200 OK`
  - 响应体
    结构与“答案正确”或“机会用尽”时类似，用于展示最终结果

    ```json
    {
    "status": "ABANDONED",
    "figure": {
        "name": "艾萨克·牛顿",
        "summary": "一位英国物理学家...",
        "imageUrl": "https://example.com/path/to/newton.jpg",
        "sourceURL": "https://en.wikipedia.org/wiki/Isaac_Newton"
    },
    "allClues": [
        "...",
        "..."
    ],
    "currentClueIndex": -1 // 固定为-1
    }
    ```

- 响应错误码
  - `404 Not Found`: 提供的 `gameId` 无效或游戏已结束。

    ```json
    { "error": "Game session not found or has already ended." }
    ```

## DB设计

### `figures` 表

- 用途: 存储人物索引库
- SQL：
  
  ```sql
  CREATE TABLE figures (
    id SERIAL PRIMARY KEY, -- 自增整数ID，用作内部关联
    name VARCHAR(255) NOT NULL, -- 人物姓名
    aliases TEXT[] NOT NULL, -- 别名数组，用于答案校验
    time_period VARCHAR(50) NOT NULL CHECK (time_period IN ('CLASSICAL', 'POST_CLASSICAL', 'EARLY_MODERN', 'MODERN')), -- 时间范围
    region VARCHAR(50) NOT NULL CHECK (region IN ('ASIA', 'EUROPE', 'AMERICAS', 'OTHER')), -- 地域范围
    wiki_url VARCHAR(512) UNIQUE NOT NULL, -- 维基百科链接
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  -- 为常用查询字段创建索引
  CREATE INDEX idx_figures_filters ON figures (time_period, region);
  ```

### `clues` 表

- 用途: 缓存由AI生成的谜题。

- SQL：

  ```sql
  CREATE TABLE clues (
      id SERIAL PRIMARY KEY,
      figure_id INTEGER NOT NULL REFERENCES figures(id) ON DELETE CASCADE, -- 关联到人物表，如果人物被删除，其所有线索也会被删除
      difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('EASY', 'NORMAL', 'HARD')), -- 难度等级
      sequence SMALLINT NOT NULL CHECK (sequence >= 1 AND sequence <= 10), -- 线索序号 (1-10)
      clue_text TEXT NOT NULL, -- 线索内容
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  -- 为查询线索创建复合索引
  CREATE INDEX idx_clues_lookup ON clues (figure_id, difficulty, sequence);
  ```

### `game_sessions`

- 用途: 存储每个正在进行或已结束的游戏会话状态。

- SQL：

  ```sql
  CREATE TABLE game_sessions (
    id UUID PRIMARY KEY, -- 由后端应用生成的UUID
    figure_id INTEGER NOT NULL REFERENCES figures(id), -- 本局游戏的目标人物
    -- 记录本局游戏中，应该按顺序揭示给玩家的具体线索ID列表
    revealed_clue_ids INTEGER[] NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CORRECT', 'GAME_OVER', 'ABANDONED')), -- 游戏状态
    revealed_clue_count SMALLINT NOT NULL DEFAULT 1, -- 已揭示的线索数量
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  -- 创建一个触发器来自动更新 updated_at 字段
  CREATE OR REPLACE FUNCTION trigger_set_timestamp()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  CREATE TRIGGER set_timestamp
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE PROCEDURE trigger_set_timestamp();
  ```

## 后端流程

### 创建新游戏

1. 用户选择游戏设置后，前端发起请求到后端。
2. 后端从人物表中随机选择一个人物。
3. 查询线索表中是否存在满足条件的线索（人物ID，难度ID，并要求该难度下1-10序号的线索均存在）
   1. 如果不满足条件，与LLM交互，生成符合需要的线索并存入数据库。
   2. 进一步优化项目，可以考虑即使当前难度下已经存在符合的线索，仍然可以随机生成部分以增加趣味性。例如从数据库中抽取序号1，4，6，7，9的线索，其余线索通过LLM补充。# TODO 暂时不需要实现
4. 初始化本局信息并记入game_session表
5. 返回响应

### 判断结果

1. 用户提交答案后，根据game_session信息，查询对应人物信息。
2. 判断人物名是否一致，如果不一致，再判断与别名是否一致。
   1. 如果判断成功，返回成功响应。
   2. 如果不一致，且游戏次数未用完，顺序揭露下一条提示。
   3. 如果不一致，且游戏次数用完，游戏结束。

### 结束游戏

1. 用户点击结束游戏， 直接返回结束的响应。
