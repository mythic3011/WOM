import { Op } from "sequelize";

export class QueryBuilder {
  constructor(model) {
    this.model = model;
    this.query = {
      where: {},
      include: [],
      order: [],
      limit: null,
      offset: null,
      attributes: null,
    };
  }

  where(field, operator, value) {
    if (arguments.length === 2) {
      this.query.where[field] = operator;
    } else {
      const opMap = {
        "=": Op.eq,
        "!=": Op.ne,
        ">": Op.gt,
        ">=": Op.gte,
        "<": Op.lt,
        "<=": Op.lte,
        like: Op.like,
        ilike: Op.iLike,
        in: Op.in,
        between: Op.between,
      };

      this.query.where[field] = {
        [opMap[operator] || Op.eq]: value,
      };
    }

    return this;
  }

  search(fields, searchTerm) {
    if (!searchTerm) return this;

    const searchConditions = fields.map((field) => ({
      [field]: {
        [Op.iLike]: `%${searchTerm}%`,
      },
    }));

    this.query.where[Op.or] = searchConditions;
    return this;
  }

  include(association, options = {}) {
    this.query.include.push({
      association,
      ...options,
    });
    return this;
  }

  orderBy(field, direction = "ASC") {
    this.query.order.push([field, direction]);
    return this;
  }

  paginate(page = 1, limit = 10) {
    this.query.limit = parseInt(limit);
    this.query.offset = (parseInt(page) - 1) * parseInt(limit);
    return this;
  }

  select(...fields) {
    this.query.attributes = fields;
    return this;
  }

  async execute() {
    return await this.model.findAll(this.query);
  }

  async executeWithCount() {
    return await this.model.findAndCountAll(this.query);
  }

  async first() {
    return await this.model.findOne(this.query);
  }

  getQuery() {
    return this.query;
  }
}

export const buildQuery = (model) => new QueryBuilder(model);
