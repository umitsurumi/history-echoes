'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Loading() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState('正在初始化时空连接...');

    // 获取游戏设置参数
    const timePeriod = searchParams.get('timePeriod') || '近代早期';
    const region = searchParams.get('region') || '欧洲';
    const difficulty = searchParams.get('difficulty') || '普通';

    useEffect(() => {
        // 模拟加载进度
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + Math.random() * 10;
                if (newProgress >= 100) {
                    clearInterval(progressInterval);
                    return 100;
                }
                return newProgress;
            });
        }, 300);

        // 模拟状态文本变化
        const statusMessages = [
            '正在初始化时空连接...',
            '正在定位历史坐标...',
            '正在检索人物数据库...',
            '正在生成线索序列...',
            '正在验证历史准确性...',
            '正在构建谜题结构...',
            '正在完成最终检查...'
        ];

        let statusIndex = 0;
        const statusInterval = setInterval(() => {
            if (statusIndex < statusMessages.length - 1) {
                statusIndex++;
                setStatusText(statusMessages[statusIndex]);
            }
        }, 1500);

        // 模拟API调用延迟，然后跳转到游戏页面
        const timer = setTimeout(() => {
            // 构建游戏页面的URL，包含所有设置参数
            const gameUrl = `/game?timePeriod=${encodeURIComponent(timePeriod)}&region=${encodeURIComponent(region)}&difficulty=${encodeURIComponent(difficulty)}`;
            router.push(gameUrl);
        }, 8000); // 8秒后跳转

        return () => {
            clearInterval(progressInterval);
            clearInterval(statusInterval);
            clearTimeout(timer);
        };
    }, [router, timePeriod, region, difficulty]);

    return (
        <div className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554189097-96a99a18018f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>

            <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 md:p-8 shadow-lg border border-slate-600">

                        {/* 加载动画 */}
                        <div className="text-center w-full fade-in">
                            {/* 加载图标 */}
                            <div className="mb-8 flex justify-center">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full border-4 border-slate-600 border-t-amber-400 animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400">
                                            <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5" />
                                            <path d="m16 8-4 4-4-4" />
                                            <path d="M12 16V8" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* 标题 */}
                            <h2 className="font-serif text-3xl text-slate-100 mb-4">
                                正在生成谜题...
                            </h2>

                            {/* 状态文本 */}
                            <p className="text-slate-400 leading-relaxed mb-6 min-h-[3rem] flex items-center justify-center">
                                {statusText}
                            </p>

                            {/* 进度条 */}
                            <div className="w-full bg-slate-700 rounded-full h-2 mb-2">
                                <div
                                    className="bg-amber-400 h-2 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>

                            {/* 进度百分比 */}
                            <div className="text-slate-400 text-sm mb-6">
                                {Math.round(progress)}% 完成
                            </div>

                            {/* 游戏设置信息 */}
                            <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div>
                                        <div className="text-amber-300 font-medium">时间</div>
                                        <div>{timePeriod}</div>
                                    </div>
                                    <div>
                                        <div className="text-amber-300 font-medium">地域</div>
                                        <div>{region}</div>
                                    </div>
                                    <div>
                                        <div className="text-amber-300 font-medium">难度</div>
                                        <div>{difficulty}</div>
                                    </div>
                                </div>
                            </div>

                            {/* 提示信息 */}
                            <div className="mt-6 text-slate-500 text-xs">
                                <p>正在跨越时空寻找历史人物，请稍候...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}