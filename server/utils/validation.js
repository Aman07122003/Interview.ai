import { APIError } from "./APIError.js";

export const validateObjectId = (id, fieldName = "ID") => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    throw new APIError(400, `Invalid ${fieldName} format`);
  }
  return true;
};

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new APIError(400, "Invalid email format");
  }
  return true;
};

export const validatePassword = (password) => {
  if (password.length < 8) {
    throw new APIError(400, "Password must be at least 8 characters long");
  }
  return true;
};