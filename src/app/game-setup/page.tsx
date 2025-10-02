'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GameSetup() {
    const [selectedTimePeriod, setSelectedTimePeriod] = useState('近代早期');
    const [selectedRegion, setSelectedRegion] = useState('欧洲');
    const [selectedDifficulty, setSelectedDifficulty] = useState('普通');

    const timePeriods = [
        { value: '古典时代', label: '古典时代', description: '约公元前8世纪 - 公元6世纪' },
        { value: '后古典时代', label: '后古典时代', description: '约公元6世纪 - 15世纪末' },
        { value: '近代早期', label: '近代早期', description: '约15世纪末 - 18世纪末' },
        { value: '近现代', label: '近现代', description: '约18世纪末至今' },
    ];

    const regions = [
        { value: '亚洲', label: '亚洲' },
        { value: '欧洲', label: '欧洲' },
        { value: '美洲', label: '美洲' },
        { value: '其他', label: '其他' },
    ];

    const difficulties = [
        { value: '简单', label: '简单' },
        { value: '普通', label: '普通' },
        { value: '困难', label: '困难' },
    ];

    return (
        <div className="min-h-screen bg-slate-900 bg-cover bg-center bg-no-repeat text-white antialiased"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}>

            <div className="flex items-center justify-center min-h-screen w-full px-4 py-8 bg-slate-900/70">
                <div className="w-full max-w-md mx-auto">
                    {/* 返回按钮 */}
                    <Link
                        href="/"
                        className="inline-flex items-center text-slate-300 hover:text-white mb-6 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        <span className="ml-2">返回首页</span>
                    </Link>

                    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 md:p-8 shadow-lg border border-slate-600">
                        {/* 标题 */}
                        <h2 className="font-serif text-3xl text-slate-100 text-center mb-6">
                            设定时空坐标
                        </h2>

                        <div className="space-y-6">
                            {/* 时间范围选择 */}
                            <div>
                                <label className="block text-sm font-medium text-amber-300 mb-3">
                                    时间范围
                                </label>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {timePeriods.map((period) => (
                                        <button
                                            key={period.value}
                                            onClick={() => setSelectedTimePeriod(period.value)}
                                            className={`py-3 px-2 rounded-md transition-all duration-200 border ${selectedTimePeriod === period.value
                                                ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 ring-2 ring-amber-400'
                                                : 'bg-slate-800/70 hover:bg-amber-500/20 text-slate-200 border-slate-700 hover:border-amber-400/30'
                                                }`}
                                        >
                                            <div className="font-medium">{period.label}</div>
                                            <div className="text-xs text-slate-400 mt-1">{period.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 地域范围选择 */}
                            <div>
                                <label className="block text-sm font-medium text-amber-300 mb-3">
                                    地域范围
                                </label>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    {regions.map((region) => (
                                        <button
                                            key={region.value}
                                            onClick={() => setSelectedRegion(region.value)}
                                            className={`py-3 px-2 rounded-md transition-all duration-200 border ${selectedRegion === region.value
                                                ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 ring-2 ring-amber-400'
                                                : 'bg-slate-800/70 hover:bg-amber-500/20 text-slate-200 border-slate-700 hover:border-amber-400/30'
                                                }`}
                                        >
                                            {region.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 难度选择 */}
                            <div>
                                <label className="block text-sm font-medium text-amber-300 mb-3">
                                    难度等级
                                </label>
                                <div className="grid grid-cols-3 gap-2 text-sm">
                                    {difficulties.map((difficulty) => (
                                        <button
                                            key={difficulty.value}
                                            onClick={() => setSelectedDifficulty(difficulty.value)}
                                            className={`py-3 px-2 rounded-md transition-all duration-200 border flex items-center justify-center ${selectedDifficulty === difficulty.value
                                                ? 'bg-amber-500/20 text-amber-200 border-amber-400/50 ring-2 ring-amber-400'
                                                : 'bg-slate-800/70 hover:bg-amber-500/20 text-slate-200 border-slate-700 hover:border-amber-400/30'
                                                }`}
                                        >
                                            {difficulty.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 说明文字 */}
                            <div className="text-slate-400 text-xs text-center">
                                <p>• 简单：全球闻名的人物</p>
                                <p>• 普通：较为知名的人物</p>
                                <p>• 困难：专业性/特定文化圈人物</p>
                            </div>

                            {/* 生成谜题按钮 */}
                            <button
                                onClick={() => {
                                    // 将中文参数转换为API枚举值
                                    const timePeriodMap: Record<string, string> = {
                                        '古典时代': 'CLASSICAL',
                                        '后古典时代': 'POST_CLASSICAL',
                                        '近代早期': 'EARLY_MODERN',
                                        '近现代': 'MODERN'
                                    };
                                    const regionMap: Record<string, string> = {
                                        '亚洲': 'ASIA',
                                        '欧洲': 'EUROPE',
                                        '美洲': 'AMERICAS',
                                        '其他': 'OTHER'
                                    };
                                    const difficultyMap: Record<string, string> = {
                                        '简单': 'EASY',
                                        '普通': 'NORMAL',
                                        '困难': 'HARD'
                                    };

                                    // 先跳转到加载页面，传递设置参数
                                    const timePeriod = timePeriodMap[selectedTimePeriod];
                                    const region = regionMap[selectedRegion];
                                    const difficulty = difficultyMap[selectedDifficulty];

                                    window.location.href = `/loading?timePeriod=${encodeURIComponent(timePeriod)}&region=${encodeURIComponent(region)}&difficulty=${encodeURIComponent(difficulty)}`;
                                }}
                                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-105"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                    <polyline points="14 2 14 8 20 8" />
                                    <path d="M8 13h8" />
                                    <path d="M8 17h8" />
                                    <path d="M8 21h8" />
                                </svg>
                                <span>生成谜题</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}