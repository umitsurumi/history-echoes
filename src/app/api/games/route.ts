import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createGameSession } from "@/lib/game-sessions";
import { getWikipediaPage } from "@/lib/wiki-service";
import { aiService, AIServiceError } from "@/lib/ai-service";
import {
    ErrorCode,
    createErrorResponse,
    createErrorResponseWithMessage,
    createSuccessResponse,
    validateRequestParams,
    validateEnumValue,
} from "@/lib/errors";
import { Clue, Figure } from "@prisma/client";
import { s2t } from "chinese-s2t";

// 时间范围、地域、难度枚举
type TimePeriod = "CLASSICAL" | "POST_CLASSICAL" | "EARLY_MODERN" | "MODERN";
type Region = "ASIA" | "EUROPE" | "AMERICAS" | "OTHER";
type Difficulty = "EASY" | "NORMAL" | "HARD";

interface GameRequest {
    timePeriod: TimePeriod;
    region: Region;
    difficulty: Difficulty;
}

export async function POST(request: NextRequest) {
    try {
        const body: GameRequest = await request.json();

        // 验证请求参数
        const validationError = validateRequestParams(body, [
            "timePeriod",
            "region",
            "difficulty",
        ]);
        if (validationError) return validationError;

        // 验证枚举值
        const validTimePeriods: TimePeriod[] = [
            "CLASSICAL",
            "POST_CLASSICAL",
            "EARLY_MODERN",
            "MODERN",
        ];
        const validRegions: Region[] = ["ASIA", "EUROPE", "AMERICAS", "OTHER"];
        const validDifficulties: Difficulty[] = ["EASY", "NORMAL", "HARD"];

        const timePeriodError = validateEnumValue(
            body.timePeriod,
            validTimePeriods,
            ErrorCode.INVALID_TIME_PERIOD
        );
        if (timePeriodError) return timePeriodError;

        const regionError = validateEnumValue(
            body.region,
            validRegions,
            ErrorCode.INVALID_REGION
        );
        if (regionError) return regionError;

        const difficultyError = validateEnumValue(
            body.difficulty,
            validDifficulties,
            ErrorCode.INVALID_DIFFICULTY
        );
        if (difficultyError) return difficultyError;

        // 根据难度确定基础难度筛选条件
        let baseDifficultyFilter: Difficulty[] = [];
        switch (body.difficulty) {
            case "EASY":
                baseDifficultyFilter = ["EASY"];
                break;
            case "NORMAL":
                baseDifficultyFilter = ["EASY", "NORMAL"];
                break;
            case "HARD":
                baseDifficultyFilter = ["EASY", "NORMAL", "HARD"];
                break;
        }

        // 查找符合条件的人物
        const figure = await findRandomFigure(
            body.timePeriod,
            body.region,
            baseDifficultyFilter
        );
        if (!figure) {
            return createErrorResponse(ErrorCode.NO_FIGURE_FOUND, 404);
        }

        const needWikiSync =
            !figure.summary || !figure.image_url || !figure.wiki_url;

        // 检查线索是否完整
        const existingClues = await prisma.clue.findMany({
            where: {
                figure_id: figure.id,
                difficulty: body.difficulty,
            },
            select: {
                sequence: true,
            },
            distinct: ["sequence"],
        });

        const needClueGeneration = existingClues.length < 10;

        // 如果人物信息不完整或线索不完整，需要调用维基百科和AI服务
        if (needWikiSync || needClueGeneration) {
            await updateLocalFigureInfo(
                figure.id,
                figure.name,
                body.difficulty
            );
        }

        // 为每个序号随机选择一条线索
        const selectedClueIds = await selectRandomClues(
            figure.id,
            body.difficulty
        );

        const selectedClue = (await prisma.clue.findUnique({
            where: { id: selectedClueIds[0] },
        })) as Clue;

        // 创建游戏会话并存储到数据库 - 存储全部10条线索ID，但只揭示第一条
        const gameId = await createGameSession(figure.id, selectedClueIds);

        // 返回响应 - 只返回第一条线索
        return createSuccessResponse(
            {
                gameId,
                revealedClues: [selectedClue.clue_text],
                currentClueIndex: 0,
            },
            201
        );
    } catch (error) {
        console.error("Error creating game:", error);
        if (error instanceof Error) {
            if (error.message === ErrorCode.WIKI_SERVICE_ERROR) {
                return createErrorResponse(ErrorCode.WIKI_SERVICE_ERROR, 503);
            }
            if (error instanceof AIServiceError) {
                return createErrorResponseWithMessage(
                    error.message,
                    ErrorCode.AI_SERVICE_ERROR,
                    503
                );
            }
            return createErrorResponse(ErrorCode.GAME_CREATION_ERROR, 500);
        }
        return createErrorResponse(ErrorCode.GAME_CREATION_ERROR, 500);
    }
}

async function findRandomFigure(
    timePeriod: TimePeriod,
    region: Region,
    difficulties: Difficulty[]
): Promise<Figure | null> {
    const figureIds = await prisma.figure.findMany({
        where: {
            time_period: timePeriod,
            region: region,
            base_difficulty: { in: difficulties },
        },
        select: {
            id: true,
        },
    });
    if (figureIds.length === 0) {
        return null;
    }
    const randomFigureId =
        figureIds[Math.floor(Math.random() * figureIds.length)].id;
    return await prisma.figure.findUnique({
        where: { id: randomFigureId },
    });
}

async function selectRandomClues(figureId: number, difficulty: Difficulty) {
    const clues = await prisma.clue.findMany({
        where: {
            figure_id: figureId,
            difficulty: difficulty,
        },
        select: { id: true, sequence: true },
    });

    // 按序号分组
    const cluesBySequence: { [key: number]: any[] } = {};
    for (let i = 1; i <= 10; i++) {
        cluesBySequence[i] = clues.filter((clue) => clue.sequence === i);
    }

    // 为每个序号随机选择一条线索
    const selectedClues: any[] = [];

    for (let i = 1; i <= 10; i++) {
        const cluesForSequence = cluesBySequence[i];
        const randomClue =
            cluesForSequence[
                Math.floor(Math.random() * cluesForSequence.length)
            ];
        selectedClues.push(randomClue);
    }

    // 按序列号降序排列（10最晦涩，1最明显）
    return selectedClues
        .sort((a, b) => b.sequence - a.sequence)
        .map((clue) => clue.id);
}

async function updateLocalFigureInfo(
    id: number,
    name: string,
    difficulty: Difficulty
) {
    const wikiPage = await getWikipediaPage(name);

    if (!wikiPage) {
        throw new Error(ErrorCode.WIKI_SERVICE_ERROR);
    }

    // 调用AI服务生成线索和summary
    const aiResult = await aiService.generateClues(
        name,
        difficulty,
        wikiPage.extract,
        wikiPage.wikiUrl
    );
    aiResult.aliases.unshift(aiResult.figureName);
    // 更新人物信息
    await prisma.figure.update({
        where: { id: id },
        data: {
            name: s2t(wikiPage.title),
            aliases: aiResult.aliases,
            summary: aiResult.summary,
            image_url: wikiPage.imageUrl,
            wiki_url: wikiPage.wikiUrl,
        } as any,
    });

    // 插入新的线索
    const clueData = aiResult.clues.map((clueText, index) => ({
        figure_id: id,
        difficulty: difficulty,
        sequence: 10 - index, // 10最晦涩，1最明显
        clue_text: clueText,
    }));

    await prisma.clue.createMany({
        data: clueData,
    });
}
