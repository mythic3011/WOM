/**
 * @file entityHelpers.js
 * @description Entity helper functions for common database operations
 * @author LI Ning 25127563d
 * @author SHEK chinhei 25017482d
 * @dependency sequelize - Database ORM
 */

import { Op } from "sequelize";

/**
 * @param {Object} Model
 * @param {string} id
 * @param {string|null} [errorMessage=null]
 * @returns {Promise<Object>}
 * @throws {Error}
 */
export const findEntityOrThrow = async (Model, id, errorMessage = null) => {
    const entity = await Model.findByPk(id);

    if (!entity) {
        throw new Error(errorMessage || `${Model.name} not found`);
    }

    return entity;
};

/**
 * @param {Object} Model
 * @param {Object} fields
 * @param {string|null} [excludeId=null]
 * @returns {Promise<boolean>}
 * @throws {Error}
 */
export const checkUniqueFields = async (Model, fields, excludeId = null) => {
    const conditions = Object.entries(fields).map(([field, value]) => ({
        [field]: value,
    }));

    const where = {
        [Op.or]: conditions,
    };

    if (excludeId) {
        where.id = { [Op.ne]: excludeId };
    }

    const existing = await Model.findOne({ where });

    if (existing) {
        const conflictField = Object.keys(fields).find(
            (field) => existing[field] === fields[field]
        );
        throw new Error(`${conflictField} already exists`);
    }

    return true;
};

/**
 * @param {Object} Model
 * @param {Object} where
 * @param {string} errorMessage
 * @returns {Promise<boolean>}
 * @throws {Error}
 */
export const checkRelatedEntitiesCount = async (Model, where, errorMessage) => {
    const count = await Model.count({ where });

    if (count > 0) {
        throw new Error(errorMessage);
    }

    return true;
};

/**
 * @param {Object} model
 * @param {string} as
 * @param {Array<string>} attributes
 * @returns {Object}
 */
export const buildIncludeWithAttributes = (model, as, attributes) => ({
    model,
    as,
    attributes,
});
