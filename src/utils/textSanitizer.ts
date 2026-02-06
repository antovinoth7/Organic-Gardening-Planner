export const sanitizeAlphaNumericSpaces = (value: string): string => {
  if (!value) return "";
  const sanitized = value.replace(/[^\p{L}\p{N}]+/gu, " ");
  return sanitized.replace(/\s+/g, " ");
};

export const sanitizeLandmarkText = (value: string): string => {
  if (!value) return "";
  const sanitized = value.replace(/[^\p{L}\p{N},.\-()/]+/gu, " ");
  return sanitized.replace(/\s+/g, " ");
};
