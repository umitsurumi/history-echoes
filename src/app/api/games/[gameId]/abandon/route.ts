import { NextRequest, NextResponse } from 'next/server';
import {
    getGameSession,
    getFigure,
    getAllCluesForFigure,
    updateGameSession
} from '@/lib/game-sessions';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params;

        // 获取游戏会话
        const gameSession = await getGameSession(gameId);

        if (!gameSession) {
            return NextResponse.json(
                { error: "Game session not found or has already ended." },
                { status: 404 }
            );
        }

        if (gameSession.status !== 'ACTIVE') {
            return NextResponse.json(
                { error: "Game session has already ended." },
                { status: 404 }
            );
        }

        // 获取人物信息
        const figure = await getFigure(gameSession.figure_id);
        if (!figure) {
            return NextResponse.json(
                { error: "Figure not found." },
                { status: 500 }
            );
        }

        // 标记游戏为已放弃
        await updateGameSession(gameId, gameSession.revealed_clue_ids, 'ABANDONED');

        // 获取所有线索
        const allClues = await getAllCluesForFigure(gameSession.figure_id, 'EASY'); // 暂时使用EASY难度

        return NextResponse.json({
            status: "ABANDONED",
            figure: {
                name: figure.name,
                summary: figure.summary || `人物简介待完善 - ${figure.name}`,
                imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                sourceURL: figure.wiki_url
            },
            allClues: allClues.map(clue => clue.clue_text),
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