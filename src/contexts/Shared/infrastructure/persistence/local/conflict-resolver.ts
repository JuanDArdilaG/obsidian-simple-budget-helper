import { Config } from "contexts/Shared/infrastructure/config/config";
import Dexie from "dexie";
import { Logger } from "../../logger";
import { LocalData } from "./local-file-manager";

export interface Conflict {
	tableName: string;
	recordId: string;
	type: "modification" | "deletion" | "creation";
	indexedDBData: unknown;
	localData: unknown;
	timestamp: string;
}

export interface ConflictResolution {
	tableName: string;
	recordId: string;
	resolvedData: unknown;
	strategy: "keep_indexeddb" | "keep_local" | "merge" | "manual";
}

export class ConflictResolver {
	private logger: Logger = new Logger("ConflictResolver");

	async detectConflicts(
		db: Dexie,
		localData: LocalData
	): Promise<Conflict[]> {
		const conflicts: Conflict[] = [];

		try {
			for (const tableName of Object.values(Config)) {
				const indexedDBRecords = await db.table(tableName).toArray();
				const localRecords = localData.data[tableName] || [];

				const tableConflicts = await this.detectTableConflicts(
					tableName,
					indexedDBRecords,
					localRecords
				);

				conflicts.push(...tableConflicts);
			}

			this.logger.debug("Conflict detection completed", {
				totalConflicts: conflicts.length,
			});
		} catch (error) {
			this.logger.error("Conflict detection error", error);
		}

		return conflicts;
	}

	private async detectTableConflicts(
		tableName: string,
		indexedDBRecords: unknown[],
		localRecords: unknown[]
	): Promise<Conflict[]> {
		const conflicts: Conflict[] = [];

		// Create maps for efficient lookup
		const indexedDBMap = new Map<string, unknown>();
		const localMap = new Map<string, unknown>();

		indexedDBRecords.forEach((record: unknown) => {
			const typedRecord = record as { id?: string };
			if (typedRecord.id) {
				indexedDBMap.set(typedRecord.id, record);
			}
		});

		localRecords.forEach((record: unknown) => {
			const typedRecord = record as { id?: string };
			if (typedRecord.id) {
				localMap.set(typedRecord.id, record);
			}
		});

		// Check for modifications (same ID, different data)
		for (const [id, indexedDBRecord] of indexedDBMap) {
			const localRecord = localMap.get(id);
			if (localRecord && !this.isEqual(indexedDBRecord, localRecord)) {
				conflicts.push({
					tableName,
					recordId: id,
					type: "modification",
					indexedDBData: indexedDBRecord,
					localData: localRecord,
					timestamp: new Date().toISOString(),
				});
			}
		}

		// Check for deletions (in local but not in IndexedDB)
		for (const [id, localRecord] of localMap) {
			if (!indexedDBMap.has(id)) {
				conflicts.push({
					tableName,
					recordId: id,
					type: "deletion",
					indexedDBData: null,
					localData: localRecord,
					timestamp: new Date().toISOString(),
				});
			}
		}

		// Check for creations (in IndexedDB but not in local)
		for (const [id, indexedDBRecord] of indexedDBMap) {
			if (!localMap.has(id)) {
				conflicts.push({
					tableName,
					recordId: id,
					type: "creation",
					indexedDBData: indexedDBRecord,
					localData: null,
					timestamp: new Date().toISOString(),
				});
			}
		}

		return conflicts;
	}

	async resolveConflicts(
		conflicts: Conflict[],
		originalData: LocalData
	): Promise<LocalData> {
		const resolvedData = { ...originalData };

		for (const conflict of conflicts) {
			const resolution = await this.resolveConflict(conflict);
			await this.applyResolution(resolution, resolvedData);
		}

		return resolvedData;
	}

	private async resolveConflict(
		conflict: Conflict
	): Promise<ConflictResolution> {
		// Default resolution strategy - prioritize local file data over IndexedDB
		let strategy: ConflictResolution["strategy"] = "keep_local";

		switch (conflict.type) {
			case "modification":
				// For modifications, always prefer local file data
				strategy = "keep_local";
				break;

			case "deletion":
				// For deletions, keep the deletion (local data)
				strategy = "keep_local";
				break;

			case "creation":
				// For creations, prefer local file data (if it exists)
				// Only keep IndexedDB data if there's no corresponding local data
				strategy =
					conflict.localData !== null
						? "keep_local"
						: "keep_indexeddb";
				break;
		}

		const resolvedData = this.getResolvedData(conflict, strategy);

		return {
			tableName: conflict.tableName,
			recordId: conflict.recordId,
			resolvedData,
			strategy,
		};
	}

	private async applyResolution(
		resolution: ConflictResolution,
		data: LocalData
	): Promise<void> {
		const tableData = data.data[resolution.tableName] || [];

		if (
			resolution.strategy === "keep_local" &&
			resolution.resolvedData === null
		) {
			// Remove the record (deletion)
			const index = tableData.findIndex(
				(record: unknown) =>
					(record as { id?: string }).id === resolution.recordId
			);
			if (index !== -1) {
				tableData.splice(index, 1);
			}
		} else if (resolution.resolvedData !== null) {
			// Update or add the record
			const index = tableData.findIndex(
				(record: unknown) =>
					(record as { id?: string }).id === resolution.recordId
			);
			if (index !== -1) {
				tableData[index] = resolution.resolvedData;
			} else {
				tableData.push(resolution.resolvedData);
			}
		}

		data.data[resolution.tableName] = tableData;
	}

	private getResolvedData(
		conflict: Conflict,
		strategy: ConflictResolution["strategy"]
	): unknown {
		switch (strategy) {
			case "keep_indexeddb":
				return conflict.indexedDBData;
			case "keep_local":
				return conflict.localData;
			case "merge":
				return this.mergeData(
					conflict.indexedDBData,
					conflict.localData
				);
			default:
				return conflict.localData;
		}
	}

	private mergeData(indexedDBData: unknown, localData: unknown): unknown {
		if (!indexedDBData) return localData;
		if (!localData) return indexedDBData;

		// Simple merge: combine properties, prefer non-null values
		const merged = { ...(indexedDBData as Record<string, unknown>) };

		for (const [key, value] of Object.entries(
			localData as Record<string, unknown>
		)) {
			if (value !== null && value !== undefined) {
				merged[key] = value;
			}
		}

		return merged;
	}

	private isEqual(obj1: unknown, obj2: unknown): boolean {
		if (obj1 === obj2) return true;
		if (!obj1 || !obj2) return false;

		const keys1 = Object.keys(obj1);
		const keys2 = Object.keys(obj2);

		if (keys1.length !== keys2.length) return false;

		for (const key of keys1) {
			if (!keys2.includes(key)) return false;

			const val1 = (obj1 as Record<string, unknown>)[key];
			const val2 = (obj2 as Record<string, unknown>)[key];

			if (typeof val1 === "object" && typeof val2 === "object") {
				if (!this.isEqual(val1, val2)) return false;
			} else if (val1 !== val2) {
				return false;
			}
		}

		return true;
	}
}
