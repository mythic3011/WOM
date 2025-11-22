import { Op } from "sequelize";

export const findEntityOrThrow = async (Model, id, errorMessage = null) => {
    const entity = await Model.findByPk(id);

    if (!entity) {
        throw new Error(errorMessage || `${Model.name} not found`);
    }

    return entity;
};

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

export const checkRelatedEntitiesCount = async (Model, where, errorMessage) => {
    const count = await Model.count({ where });

    if (count > 0) {
        throw new Error(errorMessage);
    }

    return true;
};

export const buildIncludeWithAttributes = (model, as, attributes) => ({
    model,
    as,
    attributes,
});
