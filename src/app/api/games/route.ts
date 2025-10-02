import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createGameSession } from '@/lib/game-sessions';

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
    NO_FIGURE_FOUND = 'NO_FIGURE_FOUND',
    INSUFFICIENT_CLUES = 'INSUFFICIENT_CLUES',
    DATABASE_ERROR = 'DATABASE_ERROR'
}

// 根据设置从数据库中选择合适的历史人物并随机选择线索
async function selectHistoricalFigure(timePeriod: TimePeriod, region: Region, difficulty: Difficulty) {
    try {
        // 查找符合条件的人物
        const figures = await prisma.figure.findMany({
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
                    }
                }
            }
        });

        if (figures.length === 0) {
            throw new Error(ErrorCode.NO_FIGURE_FOUND);
        }

        // 随机选择一个符合条件的人物
        const randomFigure = figures[Math.floor(Math.random() * figures.length)];

        // 检查该人物在该难度下是否有足够的线索（每个序号至少一个）
        const cluesBySequence: { [key: number]: any[] } = {};
        for (let i = 1; i <= 10; i++) {
            cluesBySequence[i] = randomFigure.clues.filter((clue: any) => clue.sequence === i);
        }

        // 验证每个序号至少有一个线索
        for (let i = 1; i <= 10; i++) {
            if (cluesBySequence[i].length === 0) {
                throw new Error(ErrorCode.INSUFFICIENT_CLUES);
            }
        }

        // 为每个序号随机选择一个线索
        const selectedClues: any[] = [];
        const selectedClueIds: number[] = [];
        
        for (let i = 1; i <= 10; i++) {
            const cluesForSequence = cluesBySequence[i];
            const randomClue = cluesForSequence[Math.floor(Math.random() * cluesForSequence.length)];
            selectedClues.push(randomClue);
            selectedClueIds.push(randomClue.id);
        }

        // 按序列号降序排列（10最晦涩，1最明显）
        selectedClues.sort((a, b) => b.sequence - a.sequence);
        selectedClueIds.sort((a, b) => {
            const clueA = selectedClues.find(clue => clue.id === a);
            const clueB = selectedClues.find(clue => clue.id === b);
            return (clueB?.sequence || 0) - (clueA?.sequence || 0);
        });

        return {
            figureId: randomFigure.id,
            figureName: randomFigure.name,
            aliases: randomFigure.aliases,
            clues: selectedClues.map((clue: any) => clue.clue_text),
            clueIds: selectedClueIds,
            timePeriod: randomFigure.time_period,
            region: randomFigure.region,
            difficulty: difficulty,
            summary: `人物简介待完善 - ${randomFigure.name}`,
            imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
            sourceURL: randomFigure.wiki_url
        };

    } catch (error) {
        console.error('Error selecting historical figure from database:', error);
        // 如果是自定义错误，直接抛出
        if (error instanceof Error && Object.values(ErrorCode).includes(error.message as ErrorCode)) {
            throw error;
        }
        // 其他数据库错误
        throw new Error(ErrorCode.DATABASE_ERROR);
    }
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

        // 创建游戏会话并存储到数据库 - 存储全部10条线索ID，但只揭示第一条
        const firstClueId = selectedFigure.clueIds[0];
        const gameId = await createGameSession(selectedFigure.figureId, selectedFigure.clueIds);

        // 返回响应 - 只返回第一条线索
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
        
        // 处理自定义错误码
        if (error instanceof Error) {
            switch (error.message) {
                case ErrorCode.NO_FIGURE_FOUND:
                    return NextResponse.json(
                        {
                            error: "未找到符合条件的历史人物",
                            errorCode: ErrorCode.NO_FIGURE_FOUND
                        },
                        { status: 404 }
                    );
                case ErrorCode.INSUFFICIENT_CLUES:
                    return NextResponse.json(
                        {
                            error: "该人物在当前难度下线索不足",
                            errorCode: ErrorCode.INSUFFICIENT_CLUES
                        },
                        { status: 422 }
                    );
                case ErrorCode.DATABASE_ERROR:
                    return NextResponse.json(
                        {
                            error: "数据库错误",
                            errorCode: ErrorCode.DATABASE_ERROR
                        },
                        { status: 500 }
                    );
            }
        }

        // 默认错误处理
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}