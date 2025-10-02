import { NextRequest } from "next/server";
import { getGameSession, getClues } from "@/lib/game-sessions";
import {
    ErrorCode,
    createErrorResponse,
    createSuccessResponse,
} from "@/lib/errors";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ gameId: string }> }
) {
    try {
        const { gameId } = await params;

        // 从数据库获取游戏会话
        const gameSession = await getGameSession(gameId);

        if (!gameSession) {
            return createErrorResponse(ErrorCode.GAME_NOT_FOUND, 404);
        }

        // 检查游戏状态是否为ACTIVE
        if (gameSession.status !== "ACTIVE") {
            return createErrorResponse(ErrorCode.GAME_ENDED, 404);
        }

        // 获取已揭示的线索 - 根据 revealed_clue_count 从 revealed_clue_ids 中切片获取
        const revealedClueIds = gameSession.revealed_clue_ids.slice(
            0,
            gameSession.revealed_clue_count
        );
        const revealedClues = await getClues(revealedClueIds);
        const clueTexts = revealedClues.map((clue) => clue.clue_text);

        // 返回游戏状态（按照技术文档要求的格式）
        return createSuccessResponse({
            gameId: gameSession.id,
            revealedClues: clueTexts,
            currentClueIndex: gameSession.revealed_clue_count - 1,
        });
    } catch (error) {
        console.error("Error getting game state:", error);
        return createErrorResponse(ErrorCode.DATABASE_ERROR, 500);
    }
}
