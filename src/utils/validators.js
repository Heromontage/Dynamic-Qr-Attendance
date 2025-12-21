// Input validation utilities

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateRollNo = (rollNo) => {
  // Format: 21CS001 (2 digits + 2-4 letters + 3 digits)
  const rollNoRegex = /^\d{2}[A-Z]{2,4}\d{3}$/;
  return rollNoRegex.test(rollNo);
};

export const validateCourseCode = (courseCode) => {
  // Format: CS101, MATH201, etc.
  const courseRegex = /^[A-Z]{2,4}\d{3}$/;
  return courseRegex.test(courseCode);
};

export const validateName = (name) => {
  return name && name.trim().length >= 3 && name.trim().length <= 50;
};

export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  return password && password.length >= 8;
};

export const validateDate = (date) => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

export const validateBranch = (branch) => {
  const validBranches = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE', 'IT', 'CHEM'];
  return validBranches.includes(branch);
};