import React from 'react';
import { motion } from 'framer-motion';
import { GlitchWrapper } from './GlitchWrapper';
import Link from 'next/link';

const navItems = [
    { id: '01', title: 'Analysis', href: '/analysis', color: '#B11226' },
    { id: '02', title: 'Dataset', href: '/dataset', color: '#888888' },
    { id: '03', title: 'Insights', href: '/insights', color: '#5A0E16' },
    { id: '04', title: 'Training', href: '/training', color: '#6B21A8' },
];

export const BarNavigation = () => {
    return (
        <div className="flex flex-col space-y-4 w-full max-w-xl mx-auto mt-20">
            {navItems.map((item) => (
                <Link href={item.href} key={item.id} className="block w-full">
                    <GlitchWrapper className="w-full">
                        <motion.div
                            whileHover={{ scale: 1.02, x: 10 }}
                            className="relative h-20 bg-void border border-spider-shadow flex items-center px-8 cursor-pointer overflow-hidden group"
                        >
                            {/* Animated Progress Bar (Red) */}
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '40%' }}
                                className="absolute left-0 top-0 bottom-0 bg-spider-red/20 z-0"
                            />

                            <div className="relative z-10 flex items-baseline space-x-6">
                                <span className="text-4xl font-heading font-black opacity-30 group-hover:opacity-100 transition-opacity">
                                    {item.id}
                                </span>
                                <span className="text-2xl font-heading font-bold uppercase tracking-widest group-hover:text-spider-red transition-colors">
                                    {item.title}
                                </span>
                            </div>

                            {/* Decorative scanline */}
                            <div className="absolute top-0 left-0 w-full h-1 bg-spider-red/50 opacity-0 group-hover:opacity-100 animate-pulse" />
                        </motion.div>
                    </GlitchWrapper>
                </Link>
            ))}
        </div>
    );
};
