// 共享的游戏会话存储
export interface GameSession {
    gameId: string;
    figure: {
        figureName: string;
        aliases: string[];
        clues: string[];
        timePeriod: string;
        region: string;
        difficulty: string;
        summary: string;
        imageUrl: string;
        sourceURL: string;
    };
    currentClueIndex: number;
    totalClues: number;
    isCompleted: boolean;
}

// 模拟游戏数据存储
export const gameSessions = new Map<string, GameSession>();

// 模拟历史人物数据
export const mockHistoricalFigures = [
    {
        figureName: "艾萨克·牛顿",
        aliases: ["牛顿", "Isaac Newton", "newton"],
        clues: [
            "关于我早年对炼金术的痴迷鲜为人知。",
            "我曾用自制的仪器进行了大量光学实验。",
            "我曾长期掌管一个国家的铸币工作，并严厉打击伪币制造者。",
            "我与一位德国数学家就微积分的发明权发生过激烈争论。",
            "我提出了三大运动定律，改变了人类对物理世界的理解。",
            "我担任过皇家学会的主席长达二十四年之久。",
            "我的代表作《自然哲学的数学原理》被誉为科学史上最重要的著作之一。",
            "我在剑桥大学三一学院学习并后来成为教授。",
            "我出生于一个农民家庭，但最终成为英国科学界的泰斗。",
            "据说，一颗苹果的坠落给了我最伟大的灵感。"
        ],
        timePeriod: "EARLY_MODERN" as const,
        region: "EUROPE" as const,
        difficulty: "EASY" as const,
        summary: "艾萨克·牛顿（1643-1727）是英国物理学家、数学家、天文学家和自然哲学家。他在《自然哲学的数学原理》中提出了万有引力定律和三大运动定律，奠定了经典力学的基础，被誉为科学史上最重要的人物之一。",
        imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        sourceURL: "https://en.wikipedia.org/wiki/Isaac_Newton"
    },
    {
        figureName: "孔子",
        aliases: ["孔夫子", "孔子", "Confucius", "Kongzi"],
        clues: [
            "我年轻时曾从事过管理仓库和畜牧的工作。",
            "我的思想核心强调'仁'与'礼'的结合。",
            "我曾周游列国十四年，希望实现政治理想但未成功。",
            "我主张'有教无类'，打破了贵族对教育的垄断。",
            "我的言行被弟子们记录在一部经典著作中。",
            "我提出了'己所不欲，勿施于人'的道德准则。",
            "我晚年回到故乡专心从事教育和典籍整理工作。",
            "我生活在春秋时期的鲁国。",
            "我的家族是宋国贵族后裔，但到我时已家道中落。",
            "我被后世尊为'至圣先师'，影响东亚文化两千余年。"
        ],
        timePeriod: "CLASSICAL" as const,
        region: "ASIA" as const,
        difficulty: "EASY" as const,
        summary: "孔子（公元前551年-公元前479年），名丘，字仲尼，春秋时期鲁国陬邑人，中国古代思想家、政治家、教育家，儒家学派创始人。他的思想对中国和世界都有深远的影响，被列为'世界十大文化名人'之首。",
        imageUrl: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        sourceURL: "https://en.wikipedia.org/wiki/Confucius"
    },
    {
        figureName: "拿破仑·波拿巴",
        aliases: ["拿破仑", "Napoleon Bonaparte", "Napoleon"],
        clues: [
            "我出生于科西嘉岛的一个没落贵族家庭。",
            "我在军事学校学习期间因口音重而遭到同学嘲笑。",
            "我通过雾月政变掌握了法国的最高权力。",
            "我主持制定了影响深远的民法典。",
            "我在一场著名的战役中惨败于俄罗斯的严冬。",
            "我曾加冕自己为法兰西第一帝国皇帝。",
            "我最终被流放到大西洋的一个偏远小岛并在此去世。",
            "我身高约1.68米，与流行传说相反。",
            "我一生指挥过60多场战役，只有少数几场失败。",
            "我的最后失败发生在比利时的一个小镇附近。"
        ],
        timePeriod: "MODERN" as const,
        region: "EUROPE" as const,
        difficulty: "NORMAL" as const,
        summary: "拿破仑·波拿巴（1769-1821）是法国军事家、政治家，法兰西第一帝国皇帝。他统治法国期间，对内颁布《拿破仑法典》，对外发动拿破仑战争，成为欧洲霸主，对欧洲历史产生了深远影响。",
        imageUrl: "https://images.unsplash.com/photo-1579783483451-41afde33bae1?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        sourceURL: "https://en.wikipedia.org/wiki/Napoleon"
    },
    {
        figureName: "成吉思汗",
        aliases: ["铁木真", "Genghis Khan", "Temujin"],
        clues: [
            "我出生于蒙古高原的一个部落首领家庭。",
            "我少年时父亲被敌人毒死，家族陷入困境。",
            "我通过统一蒙古各部落建立了庞大的帝国。",
            "我的军队以骑兵战术和严明的纪律著称。",
            "我建立了世界上第一个邮政系统。",
            "我的帝国横跨欧亚大陆，是历史上疆域最广的帝国之一。",
            "我推行宗教宽容政策，允许各宗教自由发展。",
            "我颁布了蒙古帝国的第一部法典。",
            "我的孙子忽必烈建立了中国的元朝。",
            "我被尊为蒙古民族的创始人和英雄。"
        ],
        timePeriod: "POST_CLASSICAL" as const,
        region: "ASIA" as const,
        difficulty: "HARD" as const,
        summary: "成吉思汗（1162-1227），原名铁木真，蒙古帝国可汗，世界历史上杰出的军事家、政治家。他统一了蒙古各部落，建立了蒙古帝国，并通过一系列征服战争，建立了横跨欧亚大陆的庞大帝国。",
        imageUrl: "https://images.unsplash.com/photo-1589561454226-796a8e9f8b5b?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        sourceURL: "https://en.wikipedia.org/wiki/Genghis_Khan"
    },
    {
        figureName: "列奥纳多·达·芬奇",
        aliases: ["达芬奇", "Leonardo da Vinci"],
        clues: [
            "我是私生子出身，但接受了良好的教育。",
            "我以镜像方式书写大部分笔记。",
            "我设计了飞行器、坦克等许多超前于时代的发明。",
            "我的一幅女性肖像画被认为是世界上最著名的画作之一。",
            "我精通解剖学，绘制了精确的人体解剖图。",
            "我曾在米兰公爵的宫廷中担任工程师和艺术家。",
            "我晚年应法国国王邀请移居法国。",
            "我的科学观察和艺术创作同样出色。",
            "我留下了数千页的笔记和草图。",
            "我被称为'文艺复兴时期最完美的代表'。"
        ],
        timePeriod: "POST_CLASSICAL" as const,
        region: "EUROPE" as const,
        difficulty: "NORMAL" as const,
        summary: "列奥纳多·达·芬奇（1452-1519）是意大利文艺复兴时期的天才，集画家、雕塑家、建筑师、工程师、科学家于一身。他的代表作《蒙娜丽莎》和《最后的晚餐》是世界艺术史上的杰作。",
        imageUrl: "https://images.unsplash.com/photo-1578301978896-3d1c64de7a5a?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        sourceURL: "https://en.wikipedia.org/wiki/Leonardo_da_Vinci"
    }
];

// 时间范围、地域、难度枚举
export type TimePeriod = "CLASSICAL" | "POST_CLASSICAL" | "EARLY_MODERN" | "MODERN";
export type Region = "ASIA" | "EUROPE" | "AMERICAS" | "OTHER";
export type Difficulty = "EASY" | "NORMAL" | "HARD";

// 根据设置选择合适的历史人物
export function selectHistoricalFigure(timePeriod: TimePeriod, region: Region, difficulty: Difficulty) {
    // 过滤符合条件的人物
    const filteredFigures = mockHistoricalFigures.filter(figure =>
        figure.timePeriod === timePeriod &&
        figure.region === region &&
        figure.difficulty === difficulty
    );

    // 如果没有完全匹配的，放宽条件
    if (filteredFigures.length === 0) {
        const relaxedFigures = mockHistoricalFigures.filter(figure =>
            figure.timePeriod === timePeriod && figure.region === region
        );
        if (relaxedFigures.length > 0) {
            return relaxedFigures[Math.floor(Math.random() * relaxedFigures.length)];
        }

        // 如果还没有，返回任意一个
        return mockHistoricalFigures[Math.floor(Math.random() * mockHistoricalFigures.length)];
    }

    return filteredFigures[Math.floor(Math.random() * filteredFigures.length)];
}

// 答案标准化处理
export function normalizeAnswer(answer: string): string {
    return answer
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ') // 将多个空格替换为单个空格
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '') // 移除标点符号
        .normalize('NFD') // 标准化Unicode字符
        .replace(/[\u0300-\u036f]/g, ''); // 移除重音符号
}