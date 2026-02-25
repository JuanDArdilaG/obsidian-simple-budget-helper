import { motion } from "framer-motion";

export function LoadingSpinner() {
	return (
		<motion.div
			initial={{
				opacity: 0,
			}}
			animate={{
				opacity: 1,
			}}
			exit={{
				opacity: 0,
			}}
			className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50"
		>
			<div className="flex flex-col items-center gap-4">
				{/* Spinner */}
				<div className="relative w-12 h-12">
					{/* Outer ring */}
					<motion.div
						className="absolute inset-0 border-4 border-indigo-200 rounded-full"
						initial={{
							opacity: 0.3,
						}}
						animate={{
							opacity: [0.3, 0.6, 0.3],
						}}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					/>

					{/* Spinning arc */}
					<motion.div
						className="absolute inset-0 border-4 border-transparent border-t-indigo-600 rounded-full"
						animate={{
							rotate: 360,
						}}
						transition={{
							duration: 1,
							repeat: Infinity,
							ease: "linear",
						}}
					/>

					{/* Inner dot */}
					<motion.div
						className="absolute inset-0 flex items-center justify-center"
						initial={{
							scale: 0.8,
						}}
						animate={{
							scale: [0.8, 1, 0.8],
						}}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: "easeInOut",
						}}
					>
						<div className="w-2 h-2 bg-indigo-600 rounded-full" />
					</motion.div>
				</div>

				{/* Loading text */}
				<motion.p
					className="text-sm font-medium text-gray-600"
					initial={{
						opacity: 0,
						y: 10,
					}}
					animate={{
						opacity: 1,
						y: 0,
					}}
					transition={{
						delay: 0.2,
					}}
				>
					Loading...
				</motion.p>
			</div>
		</motion.div>
	);
}
