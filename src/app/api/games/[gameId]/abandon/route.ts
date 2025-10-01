import { NextRequest, NextResponse } from 'next/server';
import { gameSessions, GameSession } from '../../game-sessions';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params;

        // 获取游戏会话
        const gameSession = gameSessions.get(gameId) as GameSession | undefined;

        if (!gameSession) {
            return NextResponse.json(
                { error: "Game session not found or has already ended." },
                { status: 404 }
            );
        }

        if (gameSession.isCompleted) {
            return NextResponse.json(
                { error: "Game session has already ended." },
                { status: 404 }
            );
        }

        // 标记游戏为已完成（放弃状态）
        gameSession.isCompleted = true;

        return NextResponse.json({
            status: "ABANDONED",
            figure: {
                name: gameSession.figure.figureName,
                summary: gameSession.figure.summary,
                imageUrl: gameSession.figure.imageUrl,
                sourceURL: gameSession.figure.sourceURL
            },
            allClues: gameSession.figure.clues,
            currentClueIndex: -1
        });

    } catch (error) {
        console.error('Error abandoning game:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}