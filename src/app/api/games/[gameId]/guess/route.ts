import { NextRequest } from "next/server";
import {
    getGameSession,
    getFigure,
    getClues,
    updateGameSession,
    incrementRevealedClueCount,
    isAnswerCorrect,
} from "@/lib/game-sessions";
import {
    ErrorCode,
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/errors";

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
            return createErrorResponse(ErrorCode.GAME_NOT_FOUND, 404);
        }

        if (gameSession.status !== "ACTIVE") {
            return createErrorResponse(ErrorCode.GAME_ENDED, 404);
        }

        const body: GuessRequest = await request.json();

        // 验证请求参数
        if (!body.guess) {
            return createErrorResponse(ErrorCode.MISSING_GUESS, 400);
        }

        // 获取人物信息
        const figure = await getFigure(gameSession.figure_id);
        if (!figure) {
            return createErrorResponse(ErrorCode.FIGURE_NOT_FOUND, 500);
        }

        // 检查答案是否正确
        const isCorrect = isAnswerCorrect(figure, body.guess);

        if (isCorrect) {
            // 答案正确，游戏结束
            await updateGameSession(
                gameId,
                gameSession.revealed_clue_ids,
                "CORRECT"
            );

            // 获取所有线索 - 从游戏会话中存储的线索ID获取
            const allClues = await getClues(gameSession.revealed_clue_ids);

            return createSuccessResponse({
                status: "CORRECT",
                figure: {
                    name: figure.name,
                    summary:
                        figure.summary || `人物简介待完善 - ${figure.name}`,
                    imageUrl:
                        figure.image_url ||
                        "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                    sourceURL: figure.wiki_url,
                },
                allClues: allClues.map((clue) => clue.clue_text),
                currentClueIndex: gameSession.revealed_clue_count - 1,
            });
        } else {
            // 答案错误
            const nextClueIndex = gameSession.revealed_clue_count;

            // 检查是否还有更多线索
            if (nextClueIndex < gameSession.revealed_clue_ids.length) {
                // 还有更多线索，显示下一条
                // 增加已揭示线索数量
                await incrementRevealedClueCount(gameId);

                // 获取当前已揭示的线索（前nextClueIndex+1条线索）
                const revealedClueIds = gameSession.revealed_clue_ids.slice(
                    0,
                    nextClueIndex + 1
                );
                const revealedClues = await getClues(revealedClueIds);

                return createSuccessResponse({
                    status: "INCORRECT",
                    revealedClues: revealedClues.map((clue) => clue.clue_text),
                    currentClueIndex: nextClueIndex,
                });
            } else {
                // 所有线索都用完了，游戏结束
                await updateGameSession(
                    gameId,
                    gameSession.revealed_clue_ids,
                    "GAME_OVER"
                );

                // 获取所有线索
                const allClues = await getClues(gameSession.revealed_clue_ids);

                return createSuccessResponse({
                    status: "GAME_OVER",
                    figure: {
                        name: figure.name,
                        summary:
                            figure.summary || `人物简介待完善 - ${figure.name}`,
                        imageUrl:
                            figure.image_url ||
                            "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                        sourceURL: figure.wiki_url,
                    },
                    allClues: allClues.map((clue) => clue.clue_text),
                    currentClueIndex: -1,
                });
            }
        }
    } catch (error) {
        console.error("Error processing guess:", error);
        return createErrorResponse(ErrorCode.DATABASE_ERROR, 500);
    }
}
