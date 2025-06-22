import { Logger } from "../../logger";
import { Config } from "contexts/Shared/infrastructure/config/config";
import { LocalData } from "./local-file-manager";
import Dexie from "dexie";

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
			this.logger.error(error);
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
		const indexedDBMap = new Map();
		const localMap = new Map();

		indexedDBRecords.forEach((record: any) => {
			if (record.id) {
				indexedDBMap.set(record.id, record);
			}
		});

		localRecords.forEach((record: any) => {
			if (record.id) {
				localMap.set(record.id, record);
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
		// Default resolution strategy based on conflict type
		let strategy: ConflictResolution["strategy"] = "keep_indexeddb";

		switch (conflict.type) {
			case "modification":
				// For modifications, prefer the most recent data based on timestamp
				strategy =
					this.getMostRecentData(
						conflict.indexedDBData,
						conflict.localData
					) === conflict.indexedDBData
						? "keep_indexeddb"
						: "keep_local";
				break;

			case "deletion":
				// For deletions, keep the deletion (local data)
				strategy = "keep_local";
				break;

			case "creation":
				// For creations, keep the creation (indexedDB data)
				strategy = "keep_indexeddb";
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
				(record: any) => record.id === resolution.recordId
			);
			if (index !== -1) {
				tableData.splice(index, 1);
			}
		} else if (resolution.resolvedData !== null) {
			// Update or add the record
			const index = tableData.findIndex(
				(record: any) => record.id === resolution.recordId
			);
			if (index !== -1) {
				tableData[index] = resolution.resolvedData;
			} else {
				tableData.push(resolution.resolvedData);
			}
		}

		data.data[resolution.tableName] = tableData;
	}

	private getMostRecentData(
		indexedDBData: unknown,
		localData: unknown
	): unknown {
		// Simple heuristic: prefer data with more recent timestamp or more complete data
		if (!indexedDBData) return localData;
		if (!localData) return indexedDBData;

		const indexedDBRecord = indexedDBData as any;
		const localRecord = localData as any;

		// Compare timestamps if available
		if (indexedDBRecord.updatedAt && localRecord.updatedAt) {
			return new Date(indexedDBRecord.updatedAt) >
				new Date(localRecord.updatedAt)
				? indexedDBData
				: localData;
		}

		// Fallback: prefer data with more properties (more complete)
		const indexedDBKeys = Object.keys(indexedDBRecord).length;
		const localKeys = Object.keys(localRecord).length;

		return indexedDBKeys >= localKeys ? indexedDBData : localData;
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
				return conflict.indexedDBData;
		}
	}

	private mergeData(indexedDBData: unknown, localData: unknown): unknown {
		if (!indexedDBData) return localData;
		if (!localData) return indexedDBData;

		// Simple merge: combine properties, prefer non-null values
		const merged = { ...(indexedDBData as any) };

		for (const [key, value] of Object.entries(localData as any)) {
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

			const val1 = (obj1 as any)[key];
			const val2 = (obj2 as any)[key];

			if (typeof val1 === "object" && typeof val2 === "object") {
				if (!this.isEqual(val1, val2)) return false;
			} else if (val1 !== val2) {
				return false;
			}
		}

		return true;
	}
}
