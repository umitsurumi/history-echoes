import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// 模拟游戏数据存储（在实际应用中应该使用数据库）
const gameSessions = new Map();

// 模拟历史人物数据
const mockHistoricalFigures = [
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
    }
];

// 时间范围、地域、难度枚举
type TimePeriod = "CLASSICAL" | "POST_CLASSICAL" | "EARLY_MODERN" | "MODERN";
type Region = "ASIA" | "EUROPE" | "AMERICAS" | "OTHER";
type Difficulty = "EASY" | "NORMAL" | "HARD";

interface GameRequest {
    timePeriod: TimePeriod;
    region: Region;
    difficulty: Difficulty;
}

interface GameSession {
    gameId: string;
    figure: typeof mockHistoricalFigures[0];
    currentClueIndex: number;
    totalClues: number;
    isCompleted: boolean;
}

// 根据设置选择合适的历史人物
function selectHistoricalFigure(timePeriod: TimePeriod, region: Region, difficulty: Difficulty) {
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

export async function POST(request: NextRequest) {
    try {
        const body: GameRequest = await request.json();

        // 验证请求参数
        if (!body.timePeriod || !body.region || !body.difficulty) {
            return NextResponse.json(
                { error: "Missing required parameters. 'timePeriod', 'region', and 'difficulty' are required." },
                { status: 400 }
            );
        }

        // 验证枚举值
        const validTimePeriods: TimePeriod[] = ["CLASSICAL", "POST_CLASSICAL", "EARLY_MODERN", "MODERN"];
        const validRegions: Region[] = ["ASIA", "EUROPE", "AMERICAS", "OTHER"];
        const validDifficulties: Difficulty[] = ["EASY", "NORMAL", "HARD"];

        if (!validTimePeriods.includes(body.timePeriod)) {
            return NextResponse.json(
                { error: "Invalid timePeriod. Must be one of: CLASSICAL, POST_CLASSICAL, EARLY_MODERN, MODERN." },
                { status: 400 }
            );
        }

        if (!validRegions.includes(body.region)) {
            return NextResponse.json(
                { error: "Invalid region. Must be one of: ASIA, EUROPE, AMERICAS, OTHER." },
                { status: 400 }
            );
        }

        if (!validDifficulties.includes(body.difficulty)) {
            return NextResponse.json(
                { error: "Invalid difficulty. Must be one of: EASY, NORMAL, HARD." },
                { status: 400 }
            );
        }

        // 模拟AI服务延迟和可能的失败（10%概率失败）
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

        if (Math.random() < 0.1) {
            return NextResponse.json(
                { error: "谜题生成服务暂时不可用，请稍后再试。" },
                { status: 503 }
            );
        }

        // 选择历史人物
        const selectedFigure = selectHistoricalFigure(body.timePeriod, body.region, body.difficulty);

        // 创建游戏会话
        const gameId = randomUUID();
        const gameSession: GameSession = {
            gameId,
            figure: selectedFigure,
            currentClueIndex: 0,
            totalClues: selectedFigure.clues.length,
            isCompleted: false
        };

        // 存储游戏会话
        gameSessions.set(gameId, gameSession);

        // 返回响应
        return NextResponse.json(
            {
                gameId,
                revealedClues: [selectedFigure.clues[0]],
                currentClueIndex: 0,
                totalClues: selectedFigure.clues.length
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('Error creating game:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}