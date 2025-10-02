import { NextRequest } from "next/server";
import {
    getGameSession,
    getFigure,
    getClues,
    updateGameSession,
} from "@/lib/game-sessions";
import {
    ErrorCode,
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/errors";

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

        // 获取人物信息
        const figure = await getFigure(gameSession.figure_id);
        console.debug("查询到人物信息：", figure);
        if (!figure) {
            return createErrorResponse(ErrorCode.FIGURE_NOT_FOUND, 500);
        }

        // 标记游戏为已放弃
        await updateGameSession(
            gameId,
            gameSession.revealed_clue_ids,
            "ABANDONED"
        );

        // 获取所有线索 - 从游戏会话中存储的线索ID获取
        const allClues = await getClues(gameSession.revealed_clue_ids);

        return createSuccessResponse({
            status: "ABANDONED",
            figure: {
                name: figure.name,
                summary: figure.summary || `人物简介待完善 - ${figure.name}`,
                imageUrl:
                    figure.image_url ||
                    "https://images.unsplash.com/photo-1563206767-5b18f218e8de?q=80&w=2669&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                sourceURL: figure.wiki_url,
            },
            allClues: allClues.map((clue) => clue.clue_text),
            currentClueIndex: -1,
        });
    } catch (error) {
        console.error("Error abandoning game:", error);
        return createErrorResponse(ErrorCode.DATABASE_ERROR, 500);
    }
}
