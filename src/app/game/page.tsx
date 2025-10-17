"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import LoadingFallback from "@/component/LoadingFallback";

type GameState = "playing" | "success" | "failed" | "gaveUp";

interface FigureInfo {
    name: string;
    summary: string;
    imageUrl: string;
    sourceURL: string;
}

interface GameResponse {
    status: "CORRECT" | "INCORRECT" | "GAME_OVER" | "ABANDONED";
    figure?: FigureInfo;
    allClues?: string[];
    revealedClues?: string[];
    currentClueIndex: number;
}

function GameComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [gameState, setGameState] = useState<GameState>("playing");
    const [currentClueIndex, setCurrentClueIndex] = useState(0);
    const [revealedClues, setRevealedClues] = useState<string[]>([]);
    const [userAnswer, setUserAnswer] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [clueAnimation, setClueAnimation] = useState("animate-fade-in-down");
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [gameId, setGameId] = useState<string>("");
    const [figureInfo, setFigureInfo] = useState<FigureInfo | null>(null);
    const [allClues, setAllClues] = useState<string[]>([]);
    const clueRef = useRef<HTMLDivElement>(null);

    // 初始化游戏数据
    useEffect(() => {
        const initializeGame = async () => {
            try {
                setIsLoading(true);

                // 从URL参数获取gameId
                const gameIdParam = searchParams.get("gameId");

                if (!gameIdParam) {
                    throw new Error("游戏ID无效，请重新开始游戏");
                }

                setGameId(gameIdParam);

                // 调用API获取游戏状态
                const response = await fetch(`/api/games/${gameIdParam}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "获取游戏状态失败");
                }

                const gameData = await response.json();

                setRevealedClues(gameData.revealedClues);
                setCurrentClueIndex(gameData.currentClueIndex);

                setIsLoading(false);
            } catch (error) {
                console.error("游戏初始化失败:", error);
                setHasError(true);
                const errorMessage =
                    error instanceof Error ? error.message : "未知错误";
                const errorCode = "GAME_INIT_ERROR";
                router.push(
                    `/error?message=${encodeURIComponent(
                        errorMessage
                    )}&errorCode=${encodeURIComponent(
                        errorCode
                    )}&retryUrl=${encodeURIComponent("/game-setup")}`
                );
            }
        };

        initializeGame();
    }, [router, searchParams]);

    // 处理线索切换动画
    useEffect(() => {
        if (clueRef.current) {
            setClueAnimation("animate-fade-in-down");
            const timer = setTimeout(() => {
                setClueAnimation("");
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [currentClueIndex]);

    // 处理答案提交
    const handleSubmit = async () => {
        if (!userAnswer.trim() || isSubmitting || !gameId) return;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const response = await fetch(`/api/games/${gameId}/guess`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ guess: userAnswer, action: "guess" }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "提交答案失败");
            }

            const result: GameResponse = await response.json();

            if (result.status === "CORRECT") {
                // 答案正确
                setFigureInfo(result.figure!);
                setAllClues(result.allClues!);
                setGameState("success");
            } else if (result.status === "INCORRECT") {
                // 答案错误，还有更多线索
                setErrorMessage("不对哦，再想想...");
                setRevealedClues(result.revealedClues!);
                setCurrentClueIndex(result.currentClueIndex);

                setTimeout(() => {
                    setUserAnswer("");
                }, 300);
            } else if (result.status === "GAME_OVER") {
                // 所有线索都用完了
                setFigureInfo(result.figure!);
                setAllClues(result.allClues!);
                setGameState("failed");
            }
        } catch (error) {
            console.error("提交答案失败:", error);
            const errorMsg =
                error instanceof Error ? error.message : "未知错误";
            setErrorMessage(errorMsg);

            // 如果是API错误，跳转到错误页面
            if (
                errorMsg.includes("游戏会话") ||
                errorMsg.includes("人物信息")
            ) {
                const errorCode =
                    error instanceof Error && error.message.includes("游戏会话")
                        ? "GAME_SESSION_ERROR"
                        : "FIGURE_ERROR";
                router.push(
                    `/error?message=${encodeURIComponent(
                        errorMsg
                    )}&errorCode=${encodeURIComponent(
                        errorCode
                    )}&retryUrl=${encodeURIComponent("/game-setup")}`
                );
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // 处理放弃游戏
    const handleGiveUp = async () => {
        if (!gameId) return;

        try {
            const response = await fetch(`/api/games/${gameId}/abandon`, {
                method: "POST",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "放弃游戏失败");
            }

            const result: GameResponse = await response.json();
            setFigureInfo(result.figure!);
            setAllClues(result.allClues!);
            setGameState("gaveUp");
        } catch (error) {
            console.error("放弃游戏失败:", error);
            const errorMsg =
                error instanceof Error ? error.message : "未知错误";
            setErrorMessage(errorMsg);

            // 如果是API错误，跳转到错误页面
            if (
                errorMsg.includes("游戏会话") ||
                errorMsg.includes("人物信息")
            ) {
                const errorCode =
                    error instanceof Error && error.message.includes("游戏会话")
                        ? "GAME_SESSION_ERROR"
                        : "FIGURE_ERROR";
                router.push(
                    `/error?message=${encodeURIComponent(
                        errorMsg
                    )}&errorCode=${encodeURIComponent(
                        errorCode
                    )}&retryUrl=${encodeURIComponent("/game-setup")}`
                );
            }
        }
    };

    // 处理跳过
    const handleSkip = async () => {
        if (isSubmitting || !gameId) return;

        setIsSubmitting(true);
        setErrorMessage("");

        try {
            const response = await fetch(`/api/games/${gameId}/guess`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ action: "skip" }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "跳过失败");
            }

            const result: GameResponse = await response.json();

            if (result.status === "INCORRECT") {
                // 跳过成功，还有更多线索
                setRevealedClues(result.revealedClues!);
                setCurrentClueIndex(result.currentClueIndex);
            } else if (result.status === "GAME_OVER") {
                // 所有线索都用完了
                setFigureInfo(result.figure!);
                setAllClues(result.allClues!);
                setGameState("failed");
            }
        } catch (error) {
            console.error("跳过失败:", error);
            const errorMsg =
                error instanceof Error ? error.message : "未知错误";
            setErrorMessage(errorMsg);
        } finally {
            setIsSubmitting(false);
        }
    };

    // 处理重新开始游戏
    const handleRestart = () => {
        router.push("/game-setup");
    };

    // 处理键盘事件
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            handleSubmit();
        }
    };

    // 游戏成功界面
    if (gameState === "success" && figureInfo) {
        return (
            <div
                className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
                }}
            >
                <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                    <div className="w-full max-w-6xl mx-auto">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-slate-600">
                            <div className="text-center animate-fade-in">
                                <div className="text-6xl mb-4">🎉</div>
                                <h1 className="font-serif text-3xl text-amber-300 mb-4">
                                    恭喜你，答对了！
                                </h1>
                                <p className="text-slate-300 mb-2">
                                    你在第{" "}
                                    <span className="text-amber-300 font-bold">
                                        {currentClueIndex + 1}
                                    </span>{" "}
                                    条线索时就猜出了正确答案
                                </p>
                            </div>

                            <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* 人物信息区域 */}
                                <div className="space-y-4 animate-fade-in animation-delay-200">
                                    <div className="character-image-container">
                                        <img
                                            src={figureInfo.imageUrl}
                                            alt="人物肖像"
                                            className="character-image"
                                        />
                                    </div>
                                    <a
                                        href={figureInfo.sourceURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-amber-300 transition-colors"
                                    >
                                        <h2 className="font-serif text-4xl text-slate-100">
                                            {figureInfo.name}
                                        </h2>
                                    </a>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {figureInfo.summary}
                                    </p>
                                </div>

                                {/* 线索回顾区域 */}
                                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 h-full flex flex-col animate-fade-in animation-delay-400">
                                    <h3 className="font-serif text-lg mb-3 text-slate-200 border-b border-slate-700 pb-2">
                                        线索回顾
                                    </h3>
                                    <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm overflow-y-auto pr-2 flex-grow max-h-80 clue-scrollbar">
                                        {allClues.map((clue, index) => (
                                            <li
                                                key={index}
                                                className={
                                                    index === currentClueIndex
                                                        ? "text-amber-300 font-bold"
                                                        : ""
                                                }
                                            >
                                                {clue}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>

                            <div className="animate-fade-in animation-delay-600">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <Link
                                        href="/"
                                        className="w-full bg-transparent border border-slate-500 hover:bg-slate-700/50 text-slate-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9 22 9 12 15 12 15 22" />
                                        </svg>
                                        <span>返回主页</span>
                                    </Link>
                                    <button
                                        onClick={handleRestart}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                            <path d="M3 3v5h5" />
                                        </svg>
                                        <span>再玩一局</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 游戏失败/放弃界
    if ((gameState === "failed" || gameState === "gaveUp") && figureInfo) {
        return (
            <div
                className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
                }}
            >
                <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                    <div className="w-full max-w-6xl mx-auto">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-slate-600">
                            <div className="text-center animate-fade-in">
                                <div className="text-6xl mb-4">🤔</div>
                                <h1 className="font-serif text-3xl text-indigo-300 mb-4">
                                    {gameState === "failed"
                                        ? "差一点就猜到了！"
                                        : "真相揭晓"}
                                </h1>
                                <p className="text-slate-300 mt-1">
                                    历史的画卷已然展开
                                </p>
                            </div>

                            <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                {/* 人物信息区域 */}
                                <div className="space-y-4 animate-fade-in animation-delay-200">
                                    <div className="character-image-container">
                                        <img
                                            src={figureInfo.imageUrl}
                                            alt="人物肖像"
                                            className="character-image"
                                        />
                                    </div>
                                    <a
                                        href={figureInfo.sourceURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="hover:text-indigo-300 transition-colors"
                                    >
                                        <h2 className="font-serif text-4xl text-slate-100">
                                            {figureInfo.name}
                                        </h2>
                                    </a>
                                    <p className="text-slate-400 text-sm leading-relaxed">
                                        {figureInfo.summary}
                                    </p>
                                </div>

                                {/* 线索回顾区域 */}
                                <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 h-full flex flex-col animate-fade-in animation-delay-400">
                                    <h3 className="font-serif text-lg mb-3 text-slate-200 border-b border-slate-700 pb-2">
                                        线索回顾
                                    </h3>
                                    <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm overflow-y-auto pr-2 flex-grow max-h-80 clue-scrollbar">
                                        {allClues.map((clue, index) => (
                                            <li
                                                key={index}
                                                className={
                                                    index ===
                                                    allClues.length - 1
                                                        ? "text-slate-200 font-bold"
                                                        : ""
                                                }
                                            >
                                                {clue}
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            </div>

                            <div className="animate-fade-in animation-delay-600">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    <Link
                                        href="/"
                                        className="w-full bg-transparent border border-slate-500 hover:bg-slate-700/50 text-slate-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                            <polyline points="9 22 9 12 15 12 15 22" />
                                        </svg>
                                        <span>返回主页</span>
                                    </Link>
                                    <button
                                        onClick={handleRestart}
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                            <path d="M3 3v5h5" />
                                        </svg>
                                        <span>再玩一局</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 主游戏界面
    return (
        <div
            className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
            style={{
                backgroundImage:
                    "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
        >
            <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 md:p-8 shadow-lg border border-slate-600">
                        {/* 头部 */}
                        <header className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-amber-300">
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5" />
                                    <path d="m16 8-4 4-4-4" />
                                    <path d="M12 16V8" />
                                </svg>
                                <h2 className="font-serif text-xl">
                                    解密中...
                                </h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-slate-400 font-mono text-sm">
                                    线索 {currentClueIndex + 1} / 10
                                </span>
                                <button
                                    onClick={() => setShowHistory(true)}
                                    className="text-slate-400 hover:text-amber-300 flex items-center gap-1.5 text-sm transition-colors"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <path d="M12 7v5l4 2" />
                                    </svg>
                                    <span>查看历史</span>
                                </button>
                            </div>
                        </header>

                        {/* 线索显示区域 */}
                        <main className="mb-8">
                            <div
                                ref={clueRef}
                                className={`w-full bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-lg p-6 text-center shadow-inner clue-transition ${clueAnimation}`}
                            >
                                <p className="text-slate-200 text-lg md:text-xl leading-relaxed">
                                    {revealedClues[currentClueIndex] ||
                                        "正在加载线索..."}
                                </p>
                            </div>
                        </main>

                        {/* 输入和按钮区域 */}
                        <footer>
                            <div className="relative">
                                {errorMessage && (
                                    <p
                                        className={`text-center mb-2 text-red-400 animate-pulse-custom ${
                                            errorMessage ? "animate-shake" : ""
                                        }`}
                                    >
                                        {errorMessage}
                                    </p>
                                )}
                                <input
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) =>
                                        setUserAnswer(e.target.value)
                                    }
                                    onKeyPress={handleKeyPress}
                                    placeholder="请输入人物姓名..."
                                    className={`w-full bg-slate-800/70 border-2 rounded-lg text-lg text-white px-4 py-3 transition duration-200 input-focus-effect ${
                                        errorMessage
                                            ? "border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 animate-shake"
                                            : "border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50"
                                    }`}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handleGiveUp}
                                        disabled={isSubmitting}
                                        className="w-full bg-transparent border border-slate-500 hover:bg-slate-700/50 text-slate-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 button-hover-effect disabled:opacity-50"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                            <line
                                                x1="4"
                                                y1="22"
                                                x2="4"
                                                y2="15"
                                            />
                                        </svg>
                                        <span>放弃</span>
                                    </button>
                                    <button
                                        onClick={handleSkip}
                                        disabled={isSubmitting}
                                        className="w-full bg-transparent border border-slate-500 hover:bg-slate-700/50 text-slate-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 button-hover-effect disabled:opacity-50"
                                    >
                                        <svg
                                            width="20"
                                            height="20"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="m5 12 7-7 7 7" />
                                            <path d="M12 19V5" />
                                        </svg>
                                        <span>跳过</span>
                                    </button>
                                </div>
                                <button
                                    onClick={handleSubmit}
                                    disabled={
                                        !userAnswer.trim() || isSubmitting
                                    }
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform transform button-hover-effect shadow-lg disabled:opacity-50 disabled:transform-none disabled:hover:scale-100"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg
                                                className="animate-spin h-5 w-5 text-white"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle
                                                    className="opacity-25"
                                                    cx="12"
                                                    cy="12"
                                                    r="10"
                                                    stroke="currentColor"
                                                    strokeWidth="4"
                                                ></circle>
                                                <path
                                                    className="opacity-75"
                                                    fill="currentColor"
                                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                ></path>
                                            </svg>
                                            <span>提交中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg
                                                width="20"
                                                height="20"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <path d="m22 2-7 20-4-9-9-4Z" />
                                                <path d="M22 2 11 13" />
                                            </svg>
                                            <span>提交</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>

            {/* 历史线索模态框 */}
            {showHistory && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-slate-600 rounded-xl shadow-2xl animate-bounce-in">
                        <div className="flex justify-between items-center p-4 border-b border-slate-700">
                            <h3 className="font-serif text-xl text-amber-300">
                                历史线索回顾
                            </h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto">
                            <ol className="list-decimal list-inside space-y-3 text-slate-300">
                                {revealedClues
                                    .slice(0, currentClueIndex + 1)
                                    .map((clue, index) => (
                                        <li
                                            key={index}
                                            className={
                                                index === currentClueIndex
                                                    ? "font-bold text-white"
                                                    : ""
                                            }
                                        >
                                            {clue}
                                        </li>
                                    ))}
                            </ol>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function Game() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <GameComponent />
        </Suspense>
    );
}
