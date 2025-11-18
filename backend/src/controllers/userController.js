import * as userService from "#services/userService.js";

export const getAllUsers = async (req, res, next) => {
  try {
    const filters = {
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
    };

    const users = await userService.getAllUsers(filters);

    res.json({
      success: true,
      data: { users },
      count: users.length,
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user },
    });
  } catch (error) {
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    res.json({
      success: true,
      message: "User updated successfully",
      data: { user },
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    if (error.message.includes("already exists")) {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const deleteSelf = async (req, res, next) => {
  try {
    const userId = req.session?.userId;
    const { password } = req.body || {};

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required. Please login." });
    }

    await userService.verifyAndDeleteUser(userId, password);

    if (req.session) {
      req.session.destroy(() => { });
    }

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ success: false, message: error.message });
    }
    if (error.message === "Invalid password") {
      return res.status(401).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getUserBookings = async (req, res, next) => {
  try {
    const bookings = await userService.getUserBookings(req.params.id);

    res.json({
      success: true,
      data: { bookings },
      count: bookings.length,
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};
