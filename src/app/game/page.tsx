'use client';

import Link from 'next/link';

export default function Game() {
    return (
        <div className="min-h-screen bg-slate-900 text-white antialiased">
            <div className="flex items-center justify-center min-h-screen w-full px-4 py-8">
                <div className="text-center w-full max-w-md mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 shadow-lg border border-slate-600">
                        <h1 className="font-serif text-3xl text-slate-100 mb-4">
                            游戏进行中
                        </h1>
                        <p className="text-slate-300 mb-6">
                            游戏主界面正在开发中...
                        </p>
                        <div className="space-y-4">
                            <Link
                                href="/"
                                className="block w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105"
                            >
                                返回首页
                            </Link>
                            <Link
                                href="/game-setup"
                                className="block w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                            >
                                重新设置
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}