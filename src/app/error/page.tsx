'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function Error() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 获取错误信息、错误码和重试参数
    const errorMessage = searchParams.get('message') || "发生未知错误，请稍后重试。";
    const errorCode = searchParams.get('errorCode') || 'UNKNOWN_EXCEPTION';
    const retryUrl = searchParams.get('retryUrl') || '/game-setup';

    const handleRetry = () => {
        router.push(retryUrl);
    };

    return (
        <div className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554189097-96a99a18018f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>

            <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                <div className="w-full max-w-md mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 md:p-8 shadow-lg border border-slate-600">

                        {/* 错误内容 */}
                        <div className="text-center w-full fade-in">
                            {/* 错误图标 */}
                            <div className="mb-8 flex justify-center">
                                <div className="h-24 w-24 rounded-full bg-indigo-900/30 border-2 border-indigo-500/50 flex items-center justify-center">
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-300">
                                        <path d="m7 21 10-10L7 1" />
                                        <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                            </div>

                            {/* 标题 */}
                            <h2 className="font-serif text-3xl text-slate-100 mb-4">
                                哎呀，出错了！
                            </h2>

                            {/* 错误信息 */}
                            <p className="text-slate-400 leading-relaxed mb-8">
                                似乎时空通讯暂时中断，请返回首页或稍后重试。
                            </p>

                            {/* 错误详情 */}
                            <div className="bg-slate-900/30 border border-slate-700 rounded-lg p-4 mb-6 text-sm text-slate-400">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center justify-center gap-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="8" x2="12" y2="12" />
                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                        </svg>
                                        <span>错误代码: {errorCode}</span>
                                    </div>
                                    <div className="flex items-start justify-center gap-2 text-xs">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                                            <path d="M12 9v4" />
                                            <path d="M12 17h.01" />
                                        </svg>
                                        <span className="text-center">错误信息: {errorMessage}</span>
                                    </div>
                                </div>
                            </div>

                            {/* 操作按钮 */}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <Link
                                    href="/"
                                    className="w-full bg-transparent border border-slate-500 hover:bg-slate-700/50 text-slate-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition duration-200"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                        <polyline points="9 22 9 12 15 12 15 22" />
                                    </svg>
                                    <span>返回主页</span>
                                </Link>
                                <button
                                    onClick={handleRetry}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-transform transform hover:scale-105 shadow-lg"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                        <path d="M3 3v5h5" />
                                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                        <path d="M16 16h5v5" />
                                    </svg>
                                    <span>重试</span>
                                </button>
                            </div>

                            {/* 技术支持信息 */}
                            <div className="mt-6 text-slate-500 text-xs">
                                <p>如果问题持续存在，请联系技术支持</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}