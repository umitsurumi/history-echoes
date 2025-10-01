import { query } from './db';
import { randomUUID } from 'crypto';

export interface GameSession {
    id: string;
    figure_id: number;
    revealed_clue_ids: number[];
    status: 'ACTIVE' | 'CORRECT' | 'GAME_OVER' | 'ABANDONED';
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
    summary?: string;
    image_url?: string;
}

export interface Clue {
    id: number;
    figure_id: number;
    difficulty: string;
    sequence: number;
    clue_text: string;
}

// 创建新游戏会话
export async function createGameSession(figureId: number, revealedClueIds: number[]): Promise<string> {
    const gameId = randomUUID();

    const insertQuery = `
    INSERT INTO game_sessions (id, figure_id, revealed_clue_ids, status, revealed_clue_count)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

    await query(insertQuery, [
        gameId,
        figureId,
        revealedClueIds,
        'ACTIVE',
        revealedClueIds.length
    ]);

    return gameId;
}

// 获取游戏会话
export async function getGameSession(gameId: string): Promise<GameSession | null> {
    const selectQuery = `
    SELECT id, figure_id, revealed_clue_ids, status, revealed_clue_count, created_at, updated_at
    FROM game_sessions
    WHERE id = $1
  `;

    const result = await query(selectQuery, [gameId]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    return {
        id: row.id,
        figure_id: row.figure_id,
        revealed_clue_ids: row.revealed_clue_ids,
        status: row.status,
        revealed_clue_count: row.revealed_clue_count,
        created_at: row.created_at,
        updated_at: row.updated_at
    };
}

// 获取人物信息
export async function getFigure(figureId: number): Promise<Figure | null> {
    const selectQuery = `
    SELECT id, name, aliases, time_period, region, wiki_url
    FROM figures
    WHERE id = $1
  `;

    const result = await query(selectQuery, [figureId]);

    if (result.rows.length === 0) {
        return null;
    }

    const row = result.rows[0];
    return {
        id: row.id,
        name: row.name,
        aliases: row.aliases,
        time_period: row.time_period,
        region: row.region,
        wiki_url: row.wiki_url
    };
}

// 获取线索信息
export async function getClues(clueIds: number[]): Promise<Clue[]> {
    if (clueIds.length === 0) return [];

    const placeholders = clueIds.map((_, index) => `$${index + 1}`).join(',');
    const selectQuery = `
    SELECT id, figure_id, difficulty, sequence, clue_text
    FROM clues
    WHERE id IN (${placeholders})
    ORDER BY sequence
  `;

    const result = await query(selectQuery, clueIds);
    return result.rows.map(row => ({
        id: row.id,
        figure_id: row.figure_id,
        difficulty: row.difficulty,
        sequence: row.sequence,
        clue_text: row.clue_text
    }));
}

// 获取人物所有线索
export async function getAllCluesForFigure(figureId: number, difficulty: string): Promise<Clue[]> {
    const selectQuery = `
    SELECT id, figure_id, difficulty, sequence, clue_text
    FROM clues
    WHERE figure_id = $1 AND difficulty = $2
    ORDER BY sequence
  `;

    const result = await query(selectQuery, [figureId, difficulty]);
    return result.rows.map(row => ({
        id: row.id,
        figure_id: row.figure_id,
        difficulty: row.difficulty,
        sequence: row.sequence,
        clue_text: row.clue_text
    }));
}

// 更新游戏会话状态
export async function updateGameSession(
    gameId: string,
    revealedClueIds: number[],
    status: 'ACTIVE' | 'CORRECT' | 'GAME_OVER' | 'ABANDONED'
): Promise<void> {
    const updateQuery = `
    UPDATE game_sessions 
    SET revealed_clue_ids = $1, status = $2, revealed_clue_count = $3, updated_at = NOW()
    WHERE id = $4
  `;

    await query(updateQuery, [revealedClueIds, status, revealedClueIds.length, gameId]);
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

// 检查答案是否正确
export function isAnswerCorrect(figure: Figure, guess: string): boolean {
    const normalizedGuess = normalizeAnswer(guess);

    // 检查主名称
    if (normalizeAnswer(figure.name) === normalizedGuess) {
        return true;
    }

    // 检查别名
    return figure.aliases.some(alias => normalizeAnswer(alias) === normalizedGuess);
}