'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// 模拟数据 - 实际开发中这些数据应该从后端API获取
const mockGameData = {
    figureName: "艾萨克·牛顿",
    aliases: ["牛顿", "Isaac Newton", "newton"],
    clues: [
        "关于我早年对炼金术的痴迷鲜为人知。",
        "我曾用自制的仪器进行了大量光学实验。",
        "我曾长期掌管一个国家的铸币工作，并严厉打击伪币制造者。",
        "我与一位德国数学家就微积分的发明权发生过激烈争论。",
        "我提出了三大运动定律，改变了人类对物理世界的理解。",
        "我担任过皇家学会的主席长达二十四年之久。",
        "我的代表作《自然哲学的数学原理》被誉为科学史上最重要的著作之一。",
        "我在剑桥大学三一学院学习并后来成为教授。",
        "我出生于一个农民家庭，但最终成为英国科学界的泰斗。",
        "据说，一颗苹果的坠落给了我最伟大的灵感。"
    ],
    timePeriod: "近代早期",
    region: "欧洲",
    difficulty: "简单",
    sourceURL: "https://en.wikipedia.org/wiki/Isaac_Newton"
};

type GameState = 'playing' | 'success' | 'failed' | 'gaveUp';

export default function Game() {
    const [gameState, setGameState] = useState<GameState>('playing');
    const [currentClueIndex, setCurrentClueIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [gameData, setGameData] = useState(mockGameData);
    const [clueAnimation, setClueAnimation] = useState('animate-fade-in-down');
    const clueRef = useRef<HTMLDivElement>(null);

    // 处理线索切换动画
    useEffect(() => {
        if (clueRef.current) {
            setClueAnimation('animate-fade-in-down');
            const timer = setTimeout(() => {
                setClueAnimation('');
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [currentClueIndex]);

    // 处理答案提交
    const handleSubmit = async () => {
        if (!userAnswer.trim() || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage('');

        // 模拟API调用延迟
        await new Promise(resolve => setTimeout(resolve, 500));

        // 答案校验逻辑
        const normalizedAnswer = userAnswer.trim().toLowerCase();
        const isCorrect = gameData.aliases.some(alias =>
            alias.toLowerCase() === normalizedAnswer
        );

        if (isCorrect) {
            // 正确答案动画
            setGameState('success');
        } else {
            // 错误答案动画
            setErrorMessage('不对哦，再想想...');

            // 如果还有更多线索，显示下一条
            if (currentClueIndex < gameData.clues.length - 1) {
                setTimeout(() => {
                    setCurrentClueIndex(prev => prev + 1);
                    setUserAnswer('');
                }, 300);
            } else {
                // 所有线索都用完了
                setTimeout(() => {
                    setGameState('failed');
                }, 300);
            }
        }

        setIsSubmitting(false);
    };

    // 处理放弃游戏
    const handleGiveUp = () => {
        setGameState('gaveUp');
    };

    // 处理重新开始游戏
    const handleRestart = () => {
        setGameState('playing');
        setCurrentClueIndex(0);
        setUserAnswer('');
        setErrorMessage('');
        setShowHistory(false);
    };

    // 处理键盘事件
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    // 游戏成功界面
    if (gameState === 'success') {
        return (
            <div className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554189097-96a99a18018f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>

                <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                    <div className="w-full max-w-2xl mx-auto">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-slate-600">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🎉</div>
                                <h1 className="font-serif text-3xl text-amber-300 mb-4">
                                    恭喜你，答对了！
                                </h1>
                                <p className="text-slate-300 mb-2">
                                    你在第 <span className="text-amber-300 font-bold">{currentClueIndex + 1}</span> 条线索时就猜出了正确答案
                                </p>

                                <div className="mt-8 p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <h2 className="font-serif text-2xl text-white mb-4">{gameData.figureName}</h2>
                                    <p className="text-slate-300 leading-relaxed">
                                        艾萨克·牛顿（1643-1727）是英国物理学家、数学家、天文学家和自然哲学家。
                                        他在《自然哲学的数学原理》中提出了万有引力定律和三大运动定律，奠定了经典力学的基础，
                                        被誉为科学史上最重要的人物之一。
                                    </p>
                                </div>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={handleRestart}
                                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                                    >
                                        再玩一局
                                    </button>
                                    <Link
                                        href="/"
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 text-center"
                                    >
                                        返回首页
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 游戏失败/放弃界面
    if (gameState === 'failed' || gameState === 'gaveUp') {
        return (
            <div className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
                style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554189097-96a99a18018f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>

                <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                    <div className="w-full max-w-2xl mx-auto">
                        <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-slate-600">
                            <div className="text-center">
                                <div className="text-6xl mb-4">🤔</div>
                                <h1 className="font-serif text-3xl text-amber-300 mb-4">
                                    {gameState === 'failed' ? '差一点就猜到了！' : '真相揭晓'}
                                </h1>

                                <div className="mt-8 p-6 bg-slate-900/50 rounded-lg border border-slate-700">
                                    <h2 className="font-serif text-2xl text-white mb-4">{gameData.figureName}</h2>
                                    <p className="text-slate-300 leading-relaxed">
                                        艾萨克·牛顿（1643-1727）是英国物理学家、数学家、天文学家和自然哲学家。
                                        他在《自然哲学的数学原理》中提出了万有引力定律和三大运动定律，奠定了经典力学的基础，
                                        被誉为科学史上最重要的人物之一。
                                    </p>
                                </div>

                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button
                                        onClick={handleRestart}
                                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                                    >
                                        再玩一局
                                    </button>
                                    <Link
                                        href="/"
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 text-center"
                                    >
                                        返回首页
                                    </Link>
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
        <div className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554189097-96a99a18018f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>

            <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 md:p-8 shadow-lg border border-slate-600">

                        {/* 头部 */}
                        <header className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2 text-amber-300">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5" />
                                    <path d="m16 8-4 4-4-4" />
                                    <path d="M12 16V8" />
                                </svg>
                                <h2 className="font-serif text-xl">解密中...</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-slate-400 font-mono text-sm">
                                    线索 {currentClueIndex + 1} / {gameData.clues.length}
                                </span>
                                <button
                                    onClick={() => setShowHistory(true)}
                                    className="text-slate-400 hover:text-amber-300 flex items-center gap-1.5 text-sm transition-colors"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                                    {gameData.clues[currentClueIndex]}
                                </p>
                            </div>
                        </main>

                        {/* 输入和按钮区域 */}
                        <footer>
                            <div className="relative">
                                {errorMessage && (
                                    <p className={`text-center mb-2 text-red-400 animate-pulse-custom ${errorMessage ? 'animate-shake' : ''}`}>
                                        {errorMessage}
                                    </p>
                                )}
                                <input
                                    type="text"
                                    value={userAnswer}
                                    onChange={(e) => setUserAnswer(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="请输入人物姓名..."
                                    className={`w-full bg-slate-800/70 border-2 rounded-lg text-lg text-white px-4 py-3 transition duration-200 input-focus-effect ${errorMessage ? 'border-red-500/70 focus:border-red-500 focus:ring-2 focus:ring-red-500/50 animate-shake' : 'border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/50'
                                        }`}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <button
                                    onClick={handleGiveUp}
                                    disabled={isSubmitting}
                                    className="w-full bg-transparent border border-slate-500 hover:bg-slate-700/50 text-slate-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200 button-hover-effect disabled:opacity-50"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                                        <line x1="4" y1="22" x2="4" y2="15" />
                                    </svg>
                                    <span>放弃</span>
                                </button>

                                <button
                                    onClick={handleSubmit}
                                    disabled={!userAnswer.trim() || isSubmitting}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform transform button-hover-effect shadow-lg disabled:opacity-50 disabled:transform-none disabled:hover:scale-100"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span>提交中...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                            <h3 className="font-serif text-xl text-amber-300">历史线索回顾</h3>
                            <button
                                onClick={() => setShowHistory(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6 6 18" />
                                    <path d="m6 6 12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="p-6 max-h-80 overflow-y-auto">
                            <ol className="list-decimal list-inside space-y-3 text-slate-300">
                                {gameData.clues.slice(0, currentClueIndex + 1).map((clue, index) => (
                                    <li
                                        key={index}
                                        className={index === currentClueIndex ? "font-bold text-white" : ""}
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