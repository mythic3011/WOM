import * as statsService from "../services/statsService.js";

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await statsService.getDashboardStats();

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserStats = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.session.userId;
    const stats = await statsService.getUserStats(userId);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

export const getPerformanceStats = async (req, res, next) => {
  try {
    const { performanceId } = req.params;
    const stats = await statsService.getPerformanceStats(performanceId);

    res.json({
      success: true,
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};
