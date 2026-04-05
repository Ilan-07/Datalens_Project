import React, { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface OdometerNumberProps {
    value: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    formatValue?: (val: number) => string;
}

const Digit = ({ digit }: { digit: string }) => {
    const spring = useSpring(0, {
        stiffness: 70,
        damping: 15,
        mass: 0.8,
    });

    const num = parseInt(digit, 10);

    useEffect(() => {
        if (!isNaN(num)) {
            spring.set(num);
        }
    }, [num, spring]);

    const y = useTransform(spring, (latest: number) => `-${latest * 10}%`);

    if (isNaN(num)) {
        return <span className="leading-none opacity-80">{digit}</span>;
    }

    return (
        <div className="relative h-[1em] w-[0.6em] overflow-hidden leading-none tabular-nums">
            <motion.div
                style={{ y }}
                className="absolute inset-x-0 top-0 flex flex-col will-change-transform"
            >
                {Array.from({ length: 10 }).map((_, i) => (
                    <div
                        key={i}
                        className="flex h-[1em] items-center justify-center leading-none"
                    >
                        {i}
                    </div>
                ))}
            </motion.div>
        </div>
    );
};

export const OdometerNumber: React.FC<OdometerNumberProps> = ({
    value,
    prefix = "",
    suffix = "",
    className = "",
    formatValue,
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <span className={`inline-flex items-center ${className}`}>
                {prefix}
                {formatValue ? formatValue(value) : value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                {suffix}
            </span>
        );
    }

    const stringValue = formatValue
        ? formatValue(value)
        : value.toLocaleString("en-US", { maximumFractionDigits: 2 });

    const renderChars = () => {
        const parts = stringValue.split(".");
        const intPart = parts[0];
        const decPart = parts.length > 1 ? parts[1] : undefined;

        const intChars = intPart.split("");
        const intElements = intChars.map((char, i) => {
            const distanceFromRight = intChars.length - 1 - i;
            return <Digit key={`int-${distanceFromRight}`} digit={char} />;
        });

        if (decPart !== undefined) {
            const decChars = decPart.split("");
            const decElements = decChars.map((char, i) => (
                <Digit key={`dec-${i}`} digit={char} />
            ));
            return [...intElements, <Digit key="dot" digit="." />, ...decElements];
        }

        return intElements;
    };

    return (
        <span
            className={`inline-flex items-center ${className}`}
            style={{
                maskImage:
                    "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
                WebkitMaskImage:
                    "linear-gradient(to bottom, transparent, black 15%, black 85%, transparent)",
            }}
        >
            {prefix && <span className="mr-1">{prefix}</span>}
            <div className="flex items-center text-[1em]">
                {renderChars()}
            </div>
            {suffix && <span className="ml-1">{suffix}</span>}
        </span>
    );
};
