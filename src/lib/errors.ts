import { NextResponse } from "next/server";

// 自定义错误码
export enum ErrorCode {
    // 游戏相关错误
    GAME_NOT_FOUND = "GAME_NOT_FOUND",
    GAME_ENDED = "GAME_ENDED",

    // 人物相关错误
    NO_FIGURE_FOUND = "NO_FIGURE_FOUND",
    FIGURE_NOT_FOUND = "FIGURE_NOT_FOUND",

    // 服务相关错误
    WIKI_SERVICE_ERROR = "WIKI_SERVICE_ERROR",
    AI_SERVICE_ERROR = "AI_SERVICE_ERROR",
    DATABASE_ERROR = "DATABASE_ERROR",

    // 请求验证错误
    MISSING_REQUIRED_PARAMS = "MISSING_REQUIRED_PARAMS",
    INVALID_TIME_PERIOD = "INVALID_TIME_PERIOD",
    INVALID_REGION = "INVALID_REGION",
    INVALID_DIFFICULTY = "INVALID_DIFFICULTY",
    MISSING_GUESS = "MISSING_GUESS",
}

// 错误信息映射
const errorMessages: Record<ErrorCode, string> = {
    [ErrorCode.GAME_NOT_FOUND]: "游戏会话不存在或已结束。",
    [ErrorCode.GAME_ENDED]: "游戏会话已结束。",
    [ErrorCode.NO_FIGURE_FOUND]: "未找到符合条件的历史人物",
    [ErrorCode.FIGURE_NOT_FOUND]: "人物信息不存在。",
    [ErrorCode.WIKI_SERVICE_ERROR]: "维基百科服务暂时不可用，请稍后再试。",
    [ErrorCode.AI_SERVICE_ERROR]: "谜题生成服务暂时不可用，请稍后再试。",
    [ErrorCode.DATABASE_ERROR]: "服务器内部错误，请稍后再试。",
    [ErrorCode.MISSING_REQUIRED_PARAMS]: "缺少必要的参数。",
    [ErrorCode.INVALID_TIME_PERIOD]: "无效的时间范围参数。",
    [ErrorCode.INVALID_REGION]: "无效的地域参数。",
    [ErrorCode.INVALID_DIFFICULTY]: "无效的难度参数。",
    [ErrorCode.MISSING_GUESS]: "请求必须包含'guess'字段。",
};

// 创建错误响应
export function createErrorResponse(
    errorCode: ErrorCode,
    status: number = 500
) {
    return NextResponse.json(
        {
            error: errorMessages[errorCode],
            errorCode,
        },
        { status }
    );
}

// 创建成功响应
export function createSuccessResponse(data: any, status: number = 200) {
    return NextResponse.json(data, { status });
}

// 验证请求参数
export function validateRequestParams(
    params: Record<string, any>,
    requiredParams: string[]
) {
    for (const param of requiredParams) {
        if (!params[param]) {
            return createErrorResponse(ErrorCode.MISSING_REQUIRED_PARAMS, 400);
        }
    }
    return null;
}

// 验证枚举值
export function validateEnumValue(
    value: string,
    validValues: string[],
    errorCode: ErrorCode
) {
    if (!validValues.includes(value)) {
        return createErrorResponse(errorCode, 400);
    }
    return null;
}
