import { storage } from "/src/services/storageService.js";
import { generateMockUsers } from "/src/data/mockUsers.js";

export async function initializeApp() {
  const hasInitialized = storage.getItem("appInitialized", false);

  if (!hasInitialized) {
    await initializeTestUsers();
    storage.setItem("appInitialized", true);
    console.log("App initialized with test users");
  }
}

export async function initializeTestUsers() {
  try {
    const existingUsers = storage.getItem("registeredUsers", []);

    if (existingUsers.length === 0) {
      const mockUsers = await generateMockUsers();
      storage.setItem("registeredUsers", mockUsers);
      console.log(`Initialized ${mockUsers.length} test users`);
      return { success: true, count: mockUsers.length };
    }

    return { success: true, count: 0, message: "Users already exist" };
  } catch (error) {
    console.error("Failed to initialize test users:", error);
    return { success: false, error: error.message };
  }
}

export function checkTestUsersExist() {
  const users = storage.getItem("registeredUsers", []);
  const hasAdmin = users.some((u) => u.id === "admin");
  const hasTestUser = users.some((u) => u.id === "user");

  return {
    exists: users.length > 0,
    hasAdmin,
    hasTestUser,
    count: users.length,
  };
}
