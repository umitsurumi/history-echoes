import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGameSession } from "@/lib/game-sessions";
import { getWikipediaPage } from "@/lib/wiki-service";
import { aiService } from "@/lib/ai-service";

// 时间范围、地域、难度枚举
type TimePeriod = "CLASSICAL" | "POST_CLASSICAL" | "EARLY_MODERN" | "MODERN";
type Region = "ASIA" | "EUROPE" | "AMERICAS" | "OTHER";
type Difficulty = "EASY" | "NORMAL" | "HARD";

interface GameRequest {
    timePeriod: TimePeriod;
    region: Region;
    difficulty: Difficulty;
}

// 自定义错误码
enum ErrorCode {
    NO_FIGURE_FOUND = "NO_FIGURE_FOUND",
    WIKI_SERVICE_ERROR = "WIKI_SERVICE_ERROR",
    AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",
}

export async function POST(request: NextRequest) {
    try {
        const body: GameRequest = await request.json();

        // 验证请求参数
        if (!body.timePeriod || !body.region || !body.difficulty) {
            return NextResponse.json(
                {
                    error: "Missing required parameters. 'timePeriod', 'region', and 'difficulty' are required.",
                },
                { status: 400 }
            );
        }

        // 验证枚举值
        const validTimePeriods: TimePeriod[] = [
            "CLASSICAL",
            "POST_CLASSICAL",
            "EARLY_MODERN",
            "MODERN",
        ];
        const validRegions: Region[] = ["ASIA", "EUROPE", "AMERICAS", "OTHER"];
        const validDifficulties: Difficulty[] = ["EASY", "NORMAL", "HARD"];

        if (!validTimePeriods.includes(body.timePeriod)) {
            return NextResponse.json(
                {
                    error: "Invalid timePeriod. Must be one of: CLASSICAL, POST_CLASSICAL, EARLY_MODERN, MODERN.",
                },
                { status: 400 }
            );
        }

        if (!validRegions.includes(body.region)) {
            return NextResponse.json(
                {
                    error: "Invalid region. Must be one of: ASIA, EUROPE, AMERICAS, OTHER.",
                },
                { status: 400 }
            );
        }

        if (!validDifficulties.includes(body.difficulty)) {
            return NextResponse.json(
                {
                    error: "Invalid difficulty. Must be one of: EASY, NORMAL, HARD.",
                },
                { status: 400 }
            );
        }

        // 查找符合条件的人物
        const figures = await prisma.figure.findMany({
            where: {
                time_period: body.timePeriod,
                region: body.region,
            },
            include: {
                clues: {
                    where: {
                        difficulty: body.difficulty,
                    },
                },
            },
        });

        if (figures.length === 0) {
            return NextResponse.json(
                {
                    error: "未找到符合条件的历史人物",
                    errorCode: ErrorCode.NO_FIGURE_FOUND,
                },
                { status: 404 }
            );
        }

        // 随机选择一个符合条件的人物
        const randomFigure =
            figures[Math.floor(Math.random() * figures.length)];

        const needWikiSync =
            !randomFigure.summary ||
            !randomFigure.image_url ||
            !randomFigure.wiki_url;

        // 检查线索是否完整
        const existingClues = await prisma.clue.findMany({
            where: {
                figure_id: randomFigure.id,
                difficulty: body.difficulty,
            },
        });

        const sequenceSet = new Set(existingClues.map((clue) => clue.sequence));
        let needClueGeneration = false;
        for (let i = 1; i <= 10; i++) {
            if (!sequenceSet.has(i)) {
                needClueGeneration = true;
                break;
            }
        }

        // 如果人物信息不完整或线索不完整，需要调用维基百科和AI服务
        if (needWikiSync || needClueGeneration) {
            try {
                // 调用维基百科服务获取完整页面信息
                const wikiPage = await getWikipediaPage(randomFigure.name);

                if (!wikiPage) {
                    throw new Error(ErrorCode.WIKI_SERVICE_ERROR);
                }

                // 调用AI服务生成线索和summary
                const clues = await aiService.generateClues(
                    randomFigure.name,
                    body.difficulty,
                    wikiPage.extract,
                    wikiPage.wikiUrl
                );

                // 更新人物信息
                await prisma.figure.update({
                    where: { id: randomFigure.id },
                    data: {
                        aliases: clues.aliases,
                        summary: clues.summary,
                        image_url: wikiPage.imageUrl,
                        wiki_url: wikiPage.wikiUrl,
                    } as any,
                });

                // 插入新的线索
                const clueData = clues.clues.map((clueText, index) => ({
                    figure_id: randomFigure.id,
                    difficulty: body.difficulty,
                    sequence: 10 - index, // 1-10
                    clue_text: clueText,
                }));

                await prisma.clue.createMany({
                    data: clueData,
                });
            } catch (error) {
                console.error("Error syncing figure info:", error);
                if (
                    error instanceof Error &&
                    error.message === ErrorCode.WIKI_SERVICE_ERROR
                ) {
                    return NextResponse.json(
                        {
                            error: "维基百科服务暂时不可用，请稍后再试。",
                            errorCode: ErrorCode.WIKI_SERVICE_ERROR,
                        },
                        { status: 503 }
                    );
                }
                if (
                    error instanceof Error &&
                    error.message.includes("AI_SERVICE")
                ) {
                    return NextResponse.json(
                        {
                            error: "谜题生成服务暂时不可用，请稍后再试。",
                            errorCode: ErrorCode.AI_SERVICE_ERROR,
                        },
                        { status: 503 }
                    );
                }
                throw error;
            }
        }

        // 为每个序号随机选择一条线索
        const clues = await prisma.clue.findMany({
            where: {
                figure_id: randomFigure.id,
                difficulty: body.difficulty,
            },
        });

        // 按序号分组
        const cluesBySequence: { [key: number]: any[] } = {};
        for (let i = 1; i <= 10; i++) {
            cluesBySequence[i] = clues.filter((clue) => clue.sequence === i);
        }

        // 为每个序号随机选择一条线索
        const selectedClues: any[] = [];
        const selectedClueIds: number[] = [];

        for (let i = 1; i <= 10; i++) {
            const cluesForSequence = cluesBySequence[i];
            const randomClue =
                cluesForSequence[
                    Math.floor(Math.random() * cluesForSequence.length)
                ];
            selectedClues.push(randomClue);
            selectedClueIds.push(randomClue.id);
        }

        // 按序列号降序排列（10最晦涩，1最明显）
        selectedClues.sort((a, b) => b.sequence - a.sequence);
        selectedClueIds.sort((a, b) => {
            const clueA = selectedClues.find((clue) => clue.id === a);
            const clueB = selectedClues.find((clue) => clue.id === b);
            return (clueB?.sequence || 0) - (clueA?.sequence || 0);
        });

        // 创建游戏会话并存储到数据库 - 存储全部10条线索ID，但只揭示第一条
        const gameId = await createGameSession(
            randomFigure.id,
            selectedClueIds
        );

        // 返回响应 - 只返回第一条线索
        return NextResponse.json(
            {
                gameId,
                revealedClues: [selectedClues[0].clue_text],
                currentClueIndex: 0,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error creating game:", error);

        // 处理数据库错误
        if (
            error instanceof Error &&
            error.message === ErrorCode.DATABASE_ERROR
        ) {
            return NextResponse.json(
                { error: "数据库错误", errorCode: ErrorCode.DATABASE_ERROR },
                { status: 500 }
            );
        }

        // 默认错误处理
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
