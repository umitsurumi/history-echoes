import { NextRequest, NextResponse } from 'next/server';
import { gameSessions, GameSession } from '../game-sessions';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params;

        // 获取游戏会话
        const gameSession = gameSessions.get(gameId) as GameSession | undefined;

        if (!gameSession) {
            return NextResponse.json(
                { error: "Game session not found." },
                { status: 404 }
            );
        }

        if (gameSession.isCompleted) {
            return NextResponse.json(
                { error: "Game session has already ended." },
                { status: 404 }
            );
        }

        // 返回游戏状态
        return NextResponse.json({
            gameId,
            revealedClues: gameSession.figure.clues.slice(0, gameSession.currentClueIndex + 1),
            currentClueIndex: gameSession.currentClueIndex,
            totalClues: gameSession.totalClues
        });

    } catch (error) {
        console.error('Error getting game state:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}