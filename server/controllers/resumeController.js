import { parseResume } from "../utils/resumeParser.js";
import { extractKeywords } from "../utils/keywordExtractor.js";
import { calculateATSScore } from "../utils/atsScore.js";
import { analyzeWithGemini } from "../utils/aiAnalyzer.js";

export const analyzeResume = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "Please upload a PDF resume.",
      });
    }

    const { jobDescription } = req.body;

    if (!jobDescription?.trim()) {
      return res.status(400).json({
        error: "Please provide a job description.",
      });
    }

    console.log("Resume analysis started");

    // --------------------------------------------------
    // STEP 1: Parse PDF
    // --------------------------------------------------

    const parseStart = Date.now();

    const text = await parseResume(req.file.buffer);

    console.log(
      `PDF parsing completed in ${Date.now() - parseStart}ms`
    );

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error:
          "No text could be extracted from this PDF. Please upload a text-based PDF.",
      });
    }

    // Avoid sending unnecessarily huge documents to the AI.
    const resumeText = text.trim().slice(0, 30000);

    // --------------------------------------------------
    // STEP 2: Keyword extraction + ATS score
    // --------------------------------------------------

    const atsStart = Date.now();

    const jdKeywords = extractKeywords(jobDescription);
    const resumeKeywords = extractKeywords(resumeText);

    const score = calculateATSScore(
      jdKeywords,
      resumeKeywords
    );

    console.log(
      `ATS calculation completed in ${Date.now() - atsStart}ms`
    );

    // --------------------------------------------------
    // STEP 3: Gemini analysis
    // --------------------------------------------------

    const aiStart = Date.now();

    const suggestions = await analyzeWithGemini(
      resumeText,
      jobDescription.trim()
    );

    console.log(
      `Gemini analysis completed in ${Date.now() - aiStart}ms`
    );

    // --------------------------------------------------
    // Final response
    // --------------------------------------------------

    console.log(
      `TOTAL analysis time: ${Date.now() - startTime}ms`
    );

    return res.json({
      success: true,
      score,
      suggestions,
    });

  } catch (err) {
    console.error(
      "Analyze Resume Error:",
      err
    );

    return res.status(500).json({
      error:
        err.message ||
        "Resume analysis failed. Please try again.",
    });
  }
};
