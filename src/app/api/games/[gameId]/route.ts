import { NextRequest, NextResponse } from 'next/server';
import { getGameSession, getClues } from '@/lib/game-sessions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params;

        // 从数据库获取游戏会话
        const gameSession = await getGameSession(gameId);

        if (!gameSession) {
            return NextResponse.json(
                { error: "Game session not found." },
                { status: 404 }
            );
        }

        // 检查游戏状态是否为ACTIVE
        if (gameSession.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: "Game session not found or has already ended." },
                { status: 404 }
            );
        }

        // 获取已揭示的线索 - 根据 revealed_clue_count 从 revealed_clue_ids 中切片获取
        const revealedClueIds = gameSession.revealed_clue_ids.slice(0, gameSession.revealed_clue_count);
        const revealedClues = await getClues(revealedClueIds);
        const clueTexts = revealedClues.map(clue => clue.clue_text);

        // 返回游戏状态（按照技术文档要求的格式）
        return NextResponse.json({
            gameId: gameSession.id,
            revealedClues: clueTexts,
            currentClueIndex: gameSession.revealed_clue_count - 1
        });

    } catch (error) {
        console.error('Error getting game state:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}