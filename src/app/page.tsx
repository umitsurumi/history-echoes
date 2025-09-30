import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
      style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554189097-96a99a18018f?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>

      <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/60">
        <div className="text-center w-full max-w-md mx-auto">
          {/* 图标 */}
          <div className="animate-fade-in">
            <div className="h-16 w-16 mx-auto text-amber-300 mb-6 flex items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4.5a2.5 2.5 0 0 0-4.96-.46 2.5 2.5 0 0 0-1.98 3 2.5 2.5 0 0 0-1.32 4.24 3 3 0 0 0 .34 5.58 2.5 2.5 0 0 0 2.96 3.08A2.5 2.5 0 0 0 12 19.5a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 12 4.5" />
                <path d="m16 8-4 4-4-4" />
                <path d="M12 16V8" />
              </svg>
            </div>
          </div>

          {/* 标题 */}
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-slate-100 animate-fade-in animation-delay-200">
            历史回响
          </h1>

          {/* 描述 */}
          <p className="mt-4 text-slate-300 leading-relaxed animate-fade-in animation-delay-400">
            十条线索，一位伟人。穿越时空迷雾，你能否揭晓谜底？
          </p>

          {/* 开始游戏按钮 */}
          <Link
            href="/game-setup"
            className="mt-10 inline-block bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-lg px-12 py-3 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 animate-fade-in animation-delay-600"
          >
            开启探索之旅
          </Link>

          {/* 游戏说明 */}
          <div className="mt-12 text-slate-400 text-sm animate-fade-in animation-delay-800">
            <p>• 根据线索猜测历史人物</p>
            <p>• 从难到易的10条线索</p>
            <p>• 支持自定义时间、地域和难度</p>
          </div>
        </div>
      </div>
    </div>
  );
}
