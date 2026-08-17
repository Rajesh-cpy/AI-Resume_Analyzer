export const extractKeywords = (text = "") => {
  return [
    ...new Set(
      text
        .toLowerCase()
        .match(/\b[a-z]{3,}\b/g) || []
    ),
  ];
};
