/**
 * Workflow Index
 * Exports all workflow definitions
 */

import { adminWorkflows } from './adminWorkflows.js';
import { userWorkflows } from './userWorkflows.js';
import { guestWorkflows } from './guestWorkflows.js';

export const WORKFLOWS = {
  ...adminWorkflows,
  ...userWorkflows,
  ...guestWorkflows
};

export { adminWorkflows, userWorkflows, guestWorkflows };
