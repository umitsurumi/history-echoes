import { NextRequest, NextResponse } from 'next/server';
import { gameSessions, normalizeAnswer, GameSession } from '../../game-sessions';

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

        const body: GuessRequest = await request.json();

        // 验证请求参数
        if (!body.guess) {
            return NextResponse.json(
                { error: "Request body must include a 'guess' field." },
                { status: 400 }
            );
        }

        // 标准化用户答案
        const normalizedGuess = normalizeAnswer(body.guess);

        // 检查答案是否正确
        const isCorrect = gameSession.figure.aliases.some(alias =>
            normalizeAnswer(alias) === normalizedGuess
        );

        if (isCorrect) {
            // 答案正确，游戏结束
            gameSession.isCompleted = true;

            return NextResponse.json({
                status: "CORRECT",
                figure: {
                    name: gameSession.figure.figureName,
                    summary: gameSession.figure.summary,
                    imageUrl: gameSession.figure.imageUrl,
                    sourceURL: gameSession.figure.sourceURL
                },
                allClues: gameSession.figure.clues,
                currentClueIndex: gameSession.currentClueIndex
            });
        } else {
            // 答案错误
            const nextClueIndex = gameSession.currentClueIndex + 1;

            if (nextClueIndex < gameSession.totalClues) {
                // 还有更多线索，显示下一条
                gameSession.currentClueIndex = nextClueIndex;

                return NextResponse.json({
                    status: "INCORRECT",
                    revealedClues: gameSession.figure.clues.slice(0, nextClueIndex + 1),
                    currentClueIndex: nextClueIndex
                });
            } else {
                // 所有线索都用完了，游戏结束
                gameSession.isCompleted = true;

                return NextResponse.json({
                    status: "GAME_OVER",
                    figure: {
                        name: gameSession.figure.figureName,
                        summary: gameSession.figure.summary,
                        imageUrl: gameSession.figure.imageUrl,
                        sourceURL: gameSession.figure.sourceURL
                    },
                    allClues: gameSession.figure.clues,
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