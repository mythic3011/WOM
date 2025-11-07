import { storage } from "/src/services/storageService.js";
import { generateMockUsers } from "/src/data/mockUsers.js";

export async function initializeApp() {
  if (!storage.getItem("appInitialized", false)) {
    const users = storage.getItem("registeredUsers", []);

    if (users.length === 0) {
      const mockUsers = await generateMockUsers();
      storage.setItem("registeredUsers", mockUsers);
      console.log(`Initialized ${mockUsers.length} test users`);
    }

    storage.setItem("appInitialized", true);
  }
}
