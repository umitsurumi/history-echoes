import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // 1. 删除所有创建时间超过7天的游戏会话
        const oldSessions = await prisma.gameSession.deleteMany({
            where: {
                created_at: {
                    lt: sevenDaysAgo,
                },
            },
        });

        // 2. 对于7天内的会话，仅保留 'ACTIVE' 状态的
        const recentInactiveSessions = await prisma.gameSession.deleteMany({
            where: {
                created_at: {
                    gte: sevenDaysAgo,
                },
                status: {
                    not: "ACTIVE",
                },
            },
        });

        const totalDeleted = oldSessions.count + recentInactiveSessions.count;

        console.log(
            `Cleanup successful: Deleted ${totalDeleted} game sessions.`
        );

        return NextResponse.json({
            message: "Cleanup successful",
            deleted_count: totalDeleted,
        });
    } catch (error) {
        console.error("Error during cleanup:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
