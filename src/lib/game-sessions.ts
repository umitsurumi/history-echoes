import { prisma } from "./prisma";
import { randomUUID } from "crypto";

export interface GameSession {
    id: string;
    figure_id: number;
    revealed_clue_ids: number[];
    status: "ACTIVE" | "CORRECT" | "GAME_OVER" | "ABANDONED";
    revealed_clue_count: number;
    created_at: Date;
    updated_at: Date;
}

export interface Figure {
    id: number;
    name: string;
    aliases: string[];
    time_period: string;
    region: string;
    wiki_url: string;
    summary: string | null;
    image_url: string | null;
    base_difficulty: string;
}

export interface Clue {
    id: number;
    figure_id: number;
    difficulty: string;
    sequence: number;
    clue_text: string;
}

export type GameStatus = "ACTIVE" | "CORRECT" | "GAME_OVER" | "ABANDONED";
export type TimePeriod =
    | "CLASSICAL"
    | "POST_CLASSICAL"
    | "EARLY_MODERN"
    | "MODERN";
export type Region = "ASIA" | "EUROPE" | "AMERICAS" | "OTHER";
export type Difficulty = "EASY" | "NORMAL" | "HARD";

// 创建新游戏会话
export async function createGameSession(
    figureId: number,
    allClueIds: number[]
): Promise<string> {
    const gameId = randomUUID();
    await prisma.gameSession.create({
        data: {
            id: gameId,
            figure_id: figureId,
            revealed_clue_ids: allClueIds, // 存储全部线索ID
            status: "ACTIVE",
            revealed_clue_count: 1, // 初始只揭示了一条线索
        },
    });

    return gameId;
}

// 获取游戏会话
export async function getGameSession(
    gameId: string
): Promise<GameSession | null> {
    const gameSession = await prisma.gameSession.findUnique({
        where: { id: gameId },
    });

    return gameSession;
}

// 获取人物信息
export async function getFigure(figureId: number): Promise<Figure | null> {
    const figure = await prisma.figure.findUnique({
        where: { id: figureId },
    });

    return figure;
}

// 获取线索信息
export async function getClues(clueIds: number[]): Promise<Clue[]> {
    if (clueIds.length === 0) return [];

    const clues = await prisma.clue.findMany({
        where: {
            id: { in: clueIds },
        },
        orderBy: {
            sequence: "desc",
        },
    });

    return clues;
}

// 更新游戏会话状态
export async function updateGameSession(
    gameId: string,
    revealedClueIds: number[],
    status: GameStatus
): Promise<void> {
    await prisma.gameSession.update({
        where: { id: gameId },
        data: {
            // 注意：这里不再更新 revealed_clue_ids，因为它在游戏初始化时已经固定
            status: status,
        },
    });
}

// 增加已揭示线索数量
export async function incrementRevealedClueCount(
    gameId: string
): Promise<void> {
    await prisma.gameSession.update({
        where: { id: gameId },
        data: {
            revealed_clue_count: {
                increment: 1,
            },
        },
    });
}

// 答案标准化处理
export function normalizeAnswer(answer: string): string {
    return answer
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ") // 将多个空格替换为单个空格
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "") // 移除标点符号
        .normalize("NFD") // 标准化Unicode字符
        .replace(/[\u0300-\u036f]/g, ""); // 移除重音符号
}

// 检查答案是否正确
export function isAnswerCorrect(figure: Figure, guess: string): boolean {
    const normalizedGuess = normalizeAnswer(guess);

    // 检查主名称
    if (normalizeAnswer(figure.name) === normalizedGuess) {
        return true;
    }

    // 检查别名
    return figure.aliases.some(
        (alias: string) => normalizeAnswer(alias) === normalizedGuess
    );
}
