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
                        sequence: 'desc'
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
                        sequence: 'desc'
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

        // 如果还是没有找到合适的人物，抛出错误
        throw new Error(`No suitable historical figure found for timePeriod: ${timePeriod}, region: ${region}, difficulty: ${difficulty}`);

    } catch (error) {
        console.error('Error selecting historical figure from database:', error);
        // 数据库错误时抛出异常
        throw error;
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