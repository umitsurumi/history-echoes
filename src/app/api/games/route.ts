import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGameSession, getAllCluesForFigure } from '@/lib/game-sessions';

// 时间范围、地域、难度枚举
type TimePeriod = "CLASSICAL" | "POST_CLASSICAL" | "EARLY_MODERN" | "MODERN";
type Region = "ASIA" | "EUROPE" | "AMERICAS" | "OTHER";
type Difficulty = "EASY" | "NORMAL" | "HARD";

interface GameRequest {
    timePeriod: TimePeriod;
    region: Region;
    difficulty: Difficulty;
}

// 根据设置从数据库中选择合适的历史人物
async function selectHistoricalFigure(timePeriod: TimePeriod, region: Region, difficulty: Difficulty) {
    try {
        // 首先尝试完全匹配
        const figuresWithClues = await prisma.figure.findMany({
            where: {
                time_period: timePeriod,
                region: region,
                clues: {
                    some: {
                        difficulty: difficulty
                    }
                }
            },
            include: {
                clues: {
                    where: {
                        difficulty: difficulty
                    },
                    orderBy: {
                        sequence: 'asc'
                    }
                }
            }
        });

        // 找到有完整10条线索的人物
        const completeFigure = figuresWithClues.find((figure: any) =>
            figure.clues.length === 10
        );

        if (completeFigure) {
            return {
                figureId: completeFigure.id,
                figureName: completeFigure.name,
                aliases: completeFigure.aliases,
                clues: completeFigure.clues.map((clue: any) => clue.clue_text),
                clueIds: completeFigure.clues.map((clue: any) => clue.id),
                timePeriod: completeFigure.time_period,
                region: completeFigure.region,
                difficulty: difficulty,
                summary: `人物简介待完善 - ${completeFigure.name}`,
                imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                sourceURL: completeFigure.wiki_url
            };
        }

        // 如果没有完全匹配，放宽条件：只匹配时间和地域
        const relaxedFigures = await prisma.figure.findMany({
            where: {
                time_period: timePeriod,
                region: region
            },
            include: {
                clues: {
                    where: {
                        difficulty: difficulty
                    },
                    orderBy: {
                        sequence: 'asc'
                    }
                }
            }
        });

        // 找到有完整10条线索的人物
        const relaxedCompleteFigure = relaxedFigures.find((figure: any) =>
            figure.clues.length === 10
        );

        if (relaxedCompleteFigure) {
            return {
                figureId: relaxedCompleteFigure.id,
                figureName: relaxedCompleteFigure.name,
                aliases: relaxedCompleteFigure.aliases,
                clues: relaxedCompleteFigure.clues.map((clue: any) => clue.clue_text),
                clueIds: relaxedCompleteFigure.clues.map((clue: any) => clue.id),
                timePeriod: relaxedCompleteFigure.time_period,
                region: relaxedCompleteFigure.region,
                difficulty: difficulty,
                summary: `人物简介待完善 - ${relaxedCompleteFigure.name}`,
                imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                sourceURL: relaxedCompleteFigure.wiki_url
            };
        }

        // 如果还是没有，返回任意一个人物（使用模拟数据作为后备）
        return getFallbackFigure(timePeriod, region, difficulty);

    } catch (error) {
        console.error('Error selecting historical figure from database:', error);
        // 数据库错误时使用后备数据
        return getFallbackFigure(timePeriod, region, difficulty);
    }
}

// 后备数据，当数据库中没有合适数据时使用
function getFallbackFigure(timePeriod: TimePeriod, region: Region, difficulty: Difficulty) {
    const fallbackFigures = [
        {
            figureId: 1,
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
            clueIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            timePeriod: "EARLY_MODERN" as const,
            region: "EUROPE" as const,
            difficulty: "EASY" as const,
            summary: "艾萨克·牛顿（1643-1727）是英国物理学家、数学家、天文学家和自然哲学家。他在《自然哲学的数学原理》中提出了万有引力定律和三大运动定律，奠定了经典力学的基础，被誉为科学史上最重要的人物之一。",
            imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            sourceURL: "https://en.wikipedia.org/wiki/Isaac_Newton"
        },
        {
            figureId: 2,
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
            clueIds: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            timePeriod: "CLASSICAL" as const,
            region: "ASIA" as const,
            difficulty: "EASY" as const,
            summary: "孔子（公元前551年-公元前479年），名丘，字仲尼，春秋时期鲁国陬邑人，中国古代思想家、政治家、教育家，儒家学派创始人。他的思想对中国和世界都有深远的影响，被列为'世界十大文化名人'之首。",
            imageUrl: "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            sourceURL: "https://en.wikipedia.org/wiki/Confucius"
        }
    ];

    // 尝试找到匹配的人物
    const matchedFigure = fallbackFigures.find(figure =>
        figure.timePeriod === timePeriod && figure.region === region
    );

    return matchedFigure || fallbackFigures[0];
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
        console.log('Creating game with settings:', body);
        // 从数据库选择历史人物
        const selectedFigure = await selectHistoricalFigure(body.timePeriod, body.region, body.difficulty);

        // 创建游戏会话并存储到数据库
        const firstClueId = selectedFigure.clueIds[0];
        const gameId = await createGameSession(selectedFigure.figureId, [firstClueId]);

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