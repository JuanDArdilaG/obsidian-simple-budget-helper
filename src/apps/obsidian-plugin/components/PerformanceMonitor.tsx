import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

// Extend Performance interface for memory API
interface PerformanceMemory {
	usedJSHeapSize: number;
	totalJSHeapSize: number;
	jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
	memory?: PerformanceMemory;
}

interface PerformanceMonitorProps {
	itemCount: number;
	visibleItems: number;
	renderTime?: number;
	className?: string;
}

export const PerformanceMonitor = ({
	itemCount,
	visibleItems,
	renderTime,
	className,
}: PerformanceMonitorProps) => {
	const [fps, setFps] = useState(0);
	const frameCount = useRef(0);
	const lastTime = useRef(performance.now());

	useEffect(() => {
		const updateFPS = () => {
			frameCount.current++;
			const currentTime = performance.now();

			if (currentTime - lastTime.current >= 1000) {
				setFps(
					Math.round(
						(frameCount.current * 1000) /
							(currentTime - lastTime.current)
					)
				);
				frameCount.current = 0;
				lastTime.current = currentTime;
			}

			requestAnimationFrame(updateFPS);
		};

		const animationId = requestAnimationFrame(updateFPS);
		return () => cancelAnimationFrame(animationId);
	}, []);

	const memoryUsage = (performance as ExtendedPerformance).memory
		? {
				used: Math.round(
					(performance as ExtendedPerformance).memory!
						.usedJSHeapSize /
						1024 /
						1024
				),
				total: Math.round(
					(performance as ExtendedPerformance).memory!
						.totalJSHeapSize /
						1024 /
						1024
				),
				limit: Math.round(
					(performance as ExtendedPerformance).memory!
						.jsHeapSizeLimit /
						1024 /
						1024
				),
		  }
		: null;

	return (
		<Box
			className={className}
			style={{
				position: "fixed",
				top: "10px",
				right: "10px",
				backgroundColor: "var(--background-primary)",
				border: "1px solid var(--background-modifier-border)",
				borderRadius: "4px",
				padding: "8px",
				fontSize: "11px",
				fontFamily: "monospace",
				zIndex: 1000,
				opacity: 0.8,
				minWidth: "200px",
			}}
		>
			<Typography
				variant="caption"
				style={{ fontWeight: "bold", display: "block" }}
			>
				Performance Monitor
			</Typography>
			<div>FPS: {fps}</div>
			<div>
				Items: {visibleItems}/{itemCount}
			</div>
			{renderTime && <div>Render: {renderTime.toFixed(2)}ms</div>}
			{memoryUsage && (
				<div>
					Memory: {memoryUsage.used}MB / {memoryUsage.total}MB
				</div>
			)}
			<div>
				Efficiency: {((visibleItems / itemCount) * 100).toFixed(1)}%
			</div>
		</Box>
	);
};
