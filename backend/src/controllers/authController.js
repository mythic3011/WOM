import * as authService from "../services/authService.js";

export const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const identifier = username || email;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        message: "Username or email is required",
      });
    }

    const user = await authService.login(identifier, password);

    req.session.userId = user.id;
    req.session.userRole = user.role;
    req.session.userName = user.name;

    req.session.save((err) => {
      if (err) {
        return next(err);
      }
      res.json({
        success: true,
        message: "Login successful",
        data: { user },
      });
    });
  } catch (error) {
    if (error.message.includes("Invalid") || error.message.includes("not active")) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }

      res.clearCookie("wom.sid");

      res.json({
        success: true,
        message: "Logout successful",
      });
    });
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.session.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const checkSession = async (req, res) => {
  if (req.session && req.session.userId) {
    return res.json({
      success: true,
      authenticated: true,
      user: {
        id: req.session.userId,
        role: req.session.userRole,
        name: req.session.userName,
      },
    });
  }

  res.json({
    success: true,
    authenticated: false,
  });
};
