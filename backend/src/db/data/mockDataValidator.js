import { User, Performance } from "#models/index.js";

export const validateUserData = (userData) => {
  const requiredFields = ["userId", "username", "email", "password", "name", "role", "status"];
  const optionalFields = ["title", "birthday", "gender", "phone", "address", "profileImage", "lastLoginAt"];
  const validRoles = ["admin", "user"];
  const validStatuses = ["active", "inactive", "suspended", "deleted"];
  const validGenders = ["male", "female", "prefer_not_to_say"];

  const errors = [];

  for (const field of requiredFields) {
    if (userData[field] === undefined || userData[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (userData.role && !validRoles.includes(userData.role)) {
    errors.push(`Invalid role: ${userData.role}. Must be one of: ${validRoles.join(", ")}`);
  }

  if (userData.status && !validStatuses.includes(userData.status)) {
    errors.push(`Invalid status: ${userData.status}. Must be one of: ${validStatuses.join(", ")}`);
  }

  if (userData.gender && !validGenders.includes(userData.gender)) {
    errors.push(`Invalid gender: ${userData.gender}. Must be one of: ${validGenders.join(", ")}`);
  }

  if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push(`Invalid email format: ${userData.email}`);
  }

  if (userData.profileImage === "") {
    errors.push("profileImage should be null or a valid URL, not an empty string");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validatePerformanceData = (performanceData) => {
  const requiredFields = ["title", "composer", "venueId", "date"];
  const optionalFields = [
    "id",
    "description",
    "venueName",
    "duration",
    "image",
    "category",
    "subcategory",
    "status",
    "orchestra",
    "conductor",
    "soloists",
    "program",
    "showtimes",
    "pricingSections",
    "seatMap",
    "tags",
    "ageRestriction",
    "dresscode",
    "totalSeats",
    "availableSeats",
    "bookedSeats",
    "seatMapVersion",
    "priceTiers",
    "pricingZones",
  ];

  const validStatuses = [
    "upcoming",
    "on_sale",
    "sold_out",
    "early_bird",
    "pre_order",
    "completed",
    "cancelled",
  ];

  const errors = [];

  for (const field of requiredFields) {
    if (performanceData[field] === undefined || performanceData[field] === null) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (performanceData.status && !validStatuses.includes(performanceData.status)) {
    errors.push(`Invalid status: ${performanceData.status}. Must be one of: ${validStatuses.join(", ")}`);
  }

  if (performanceData.soloists && !Array.isArray(performanceData.soloists)) {
    errors.push("soloists must be an array");
  }

  if (performanceData.program && !Array.isArray(performanceData.program)) {
    errors.push("program must be an array");
  }

  if (performanceData.showtimes && !Array.isArray(performanceData.showtimes)) {
    errors.push("showtimes must be an array");
  }

  if (performanceData.pricingSections && !Array.isArray(performanceData.pricingSections)) {
    errors.push("pricingSections must be an array");
  }

  if (performanceData.tags && !Array.isArray(performanceData.tags)) {
    errors.push("tags must be an array");
  }

  if (performanceData.image === "") {
    errors.push("image should be null or a valid URL, not an empty string");
  }

  if (performanceData.date) {
    const date = new Date(performanceData.date);
    if (isNaN(date.getTime())) {
      errors.push(`Invalid date format: ${performanceData.date}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateMockData = (users, performances) => {
  const results = {
    users: {
      total: users.length,
      valid: 0,
      invalid: 0,
      errors: [],
    },
    performances: {
      total: performances.length,
      valid: 0,
      invalid: 0,
      errors: [],
    },
  };

  users.forEach((user, index) => {
    const validation = validateUserData(user);
    if (validation.valid) {
      results.users.valid++;
    } else {
      results.users.invalid++;
      results.users.errors.push({
        index,
        userId: user.userId,
        errors: validation.errors,
      });
    }
  });

  performances.forEach((performance, index) => {
    const validation = validatePerformanceData(performance);
    if (validation.valid) {
      results.performances.valid++;
    } else {
      results.performances.invalid++;
      results.performances.errors.push({
        index,
        id: performance.id,
        title: performance.title,
        errors: validation.errors,
      });
    }
  });

  return results;
};

export const handleEdgeCases = (data, type) => {
  if (type === "user") {
    return {
      ...data,
      profileImage: data.profileImage === "" ? null : data.profileImage,
      address: data.address === "" ? null : data.address,
      phone: data.phone === "" ? null : data.phone,
      birthday: data.birthday === "" ? null : data.birthday,
      title: data.title === "" ? null : data.title,
    };
  }

  if (type === "performance") {
    return {
      ...data,
      image: data.image === "" ? null : data.image,
      description: data.description === "" ? null : data.description,
      duration: data.duration === "" ? null : data.duration,
      category: data.category === "" ? null : data.category,
      subcategory: data.subcategory === "" ? null : data.subcategory,
      orchestra: data.orchestra === "" ? null : data.orchestra,
      conductor: data.conductor === "" ? null : data.conductor,
      ageRestriction: data.ageRestriction === "" ? null : data.ageRestriction,
      dresscode: data.dresscode === "" ? null : data.dresscode,
      soloists: Array.isArray(data.soloists) ? data.soloists : [],
      program: Array.isArray(data.program) ? data.program : [],
      showtimes: Array.isArray(data.showtimes) ? data.showtimes : [],
      pricingSections: Array.isArray(data.pricingSections) ? data.pricingSections : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
    };
  }

  return data;
};
