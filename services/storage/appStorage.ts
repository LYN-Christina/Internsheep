import { removeStorageItem } from "@/services/storage/jsonStorage";
import { getAllStorageKeys } from "@/services/storage/storageKeys";

export function clearAllData() {
  getAllStorageKeys().forEach((key) => removeStorageItem(key));
}
