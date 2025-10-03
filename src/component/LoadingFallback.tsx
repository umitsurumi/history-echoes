// src/components/LoadingFallback.tsx
export default function LoadingFallback() {
    return (
        <div
            className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
            style={{
                backgroundImage:
                    "url('https://images.unsplash.com/photo-1554189097-96a99a18018f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')",
            }}
        >
            <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                <div className="w-full max-w-sm mx-auto">
                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 md:p-8 shadow-lg border border-slate-600">
                        {/* 加载动画 */}
                        <div className="text-center w-full fade-in">
                            {/* 加载图标 */}
                            <div className="mb-8 flex justify-center">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full border-4 border-slate-600 border-t-amber-400 animate-spin"></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <svg
                                            width="32"
                                            height="32"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="text-amber-400"
                                        >
                                            <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5" />
                                            <path d="m16 8-4 4-4-4" />
                                            <path d="M12 16V8" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* 标题 */}
                            <h2 className="font-serif text-3xl text-slate-100 mb-4">
                                正在加载...
                            </h2>

                            {/* 状态文本 */}
                            <p className="text-slate-400 leading-relaxed">
                                正在跨越时空连接，请稍候...
                            </p>

                            {/* 提示信息 */}
                            <div className="mt-6 text-slate-500 text-xs">
                                <p>历史回响正在准备中</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
