// server\src\utils\getValidationMessage.js
const getValidationMessage = (error) => {
  const firstIssue = error?.issues?.[0] || error?.errors?.[0];

  return firstIssue?.message || "Invalid input";
};

export default getValidationMessage;