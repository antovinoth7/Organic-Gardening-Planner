export const sanitizeAlphaNumericSpaces = (value: string): string => {
  if (!value) return "";
  const sanitized = value.replace(/[^a-zA-Z0-9]+/g, " ");
  return sanitized.replace(/\s+/g, " ");
};

export const sanitizeLandmarkText = (value: string): string => {
  if (!value) return "";
  const sanitized = value.replace(/[^a-zA-Z0-9,.\-()/]+/g, " ");
  return sanitized.replace(/\s+/g, " ");
};
