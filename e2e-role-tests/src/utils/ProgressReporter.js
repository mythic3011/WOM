/**
 * Progress Reporter - Provides real-time progress updates
 */
export class ProgressReporter {
  constructor() {
    this.currentRole = null;
    this.currentPage = null;
    this.currentWorkflow = null;
    this.startTime = null;
    this.roleStats = {};
  }

  /**
   * Start tracking a role
   */
  startRole(role) {
    this.currentRole = role;
    this.roleStats[role] = {
      startTime: Date.now(),
      pagesVisited: 0,
      workflowsExecuted: 0,
      errors: 0
    };
  }

  /**
   * Update progress
   */
  updateProgress(role, page, workflow) {
    this.currentRole = role;
    this.currentPage = page;
    this.currentWorkflow = workflow;

    if (page && this.roleStats[role]) {
      this.roleStats[role].pagesVisited++;
    }

    if (workflow && this.roleStats[role]) {
      this.roleStats[role].workflowsExecuted++;
    }
  }

  /**
   * Complete a role
   */
  completeRole(role) {
    if (this.roleStats[role]) {
      this.roleStats[role].endTime = Date.now();
      this.roleStats[role].duration = this.roleStats[role].endTime - this.roleStats[role].startTime;
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      currentRole: this.currentRole,
      currentPage: this.currentPage,
      currentWorkflow: this.currentWorkflow,
      stats: this.roleStats
    };
  }

  /**
   * Get estimated time remaining
   */
  getEstimatedTimeRemaining(totalRoles, completedRoles) {
    if (completedRoles === 0) {
      return 'Calculating...';
    }

    const completedDurations = Object.values(this.roleStats)
      .filter(s => s.duration)
      .map(s => s.duration);

    if (completedDurations.length === 0) {
      return 'Calculating...';
    }

    const avgDuration = completedDurations.reduce((sum, d) => sum + d, 0) / completedDurations.length;
    const remaining = (totalRoles - completedRoles) * avgDuration;

    return `${(remaining / 1000).toFixed(0)}s`;
  }
}
