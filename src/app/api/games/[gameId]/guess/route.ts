import { NextRequest, NextResponse } from 'next/server';
import {
    getGameSession,
    getFigure,
    getClues,
    getAllCluesForFigure,
    updateGameSession,
    isAnswerCorrect
} from '@/lib/game-sessions';

interface GuessRequest {
    guess: string;
}

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

        const body: GuessRequest = await request.json();

        // 验证请求参数
        if (!body.guess) {
            return NextResponse.json(
                { error: "Request body must include a 'guess' field." },
                { status: 400 }
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

        // 检查答案是否正确
        const isCorrect = isAnswerCorrect(figure, body.guess);

        if (isCorrect) {
            // 答案正确，游戏结束
            await updateGameSession(gameId, gameSession.revealed_clue_ids, 'CORRECT');

            // 获取所有线索
            const allClues = await getAllCluesForFigure(gameSession.figure_id, 'EASY'); // 暂时使用EASY难度，后续可以根据实际难度调整

            return NextResponse.json({
                status: "CORRECT",
                figure: {
                    name: figure.name,
                    summary: figure.summary || `人物简介待完善 - ${figure.name}`,
                    imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    sourceURL: figure.wiki_url
                },
                allClues: allClues.map(clue => clue.clue_text),
                currentClueIndex: gameSession.revealed_clue_count - 1
            });
        } else {
            // 答案错误
            const nextClueIndex = gameSession.revealed_clue_count;
            const allClues = await getAllCluesForFigure(gameSession.figure_id, 'EASY'); // 暂时使用EASY难度

            if (nextClueIndex < allClues.length) {
                // 还有更多线索，显示下一条
                const nextClue = allClues[nextClueIndex];
                const newRevealedClueIds = [...gameSession.revealed_clue_ids, nextClue.id];

                await updateGameSession(gameId, newRevealedClueIds, 'ACTIVE');

                // 获取已揭示的线索文本
                const revealedClues = await getClues(newRevealedClueIds);

                return NextResponse.json({
                    status: "INCORRECT",
                    revealedClues: revealedClues.map(clue => clue.clue_text),
                    currentClueIndex: nextClueIndex
                });
            } else {
                // 所有线索都用完了，游戏结束
                await updateGameSession(gameId, gameSession.revealed_clue_ids, 'GAME_OVER');

                return NextResponse.json({
                    status: "GAME_OVER",
                    figure: {
                        name: figure.name,
                        summary: figure.summary || `人物简介待完善 - ${figure.name}`,
                        imageUrl: "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                        sourceURL: figure.wiki_url
                    },
                    allClues: allClues.map(clue => clue.clue_text),
                    currentClueIndex: -1
                });
            }
        }

    } catch (error) {
        console.error('Error processing guess:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}