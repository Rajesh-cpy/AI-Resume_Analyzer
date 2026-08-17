export const calculateATSScore = (
  jdKeywords,
  resumeKeywords
) => {
  const uniqueJD = [...new Set(jdKeywords)];

  if (uniqueJD.length === 0) {
    return 0;
  }

  const resumeSet = new Set(resumeKeywords);

  const matches = uniqueJD.filter((keyword) =>
    resumeSet.has(keyword)
  );

  return Math.round(
    (matches.length / uniqueJD.length) * 100
  );
};
