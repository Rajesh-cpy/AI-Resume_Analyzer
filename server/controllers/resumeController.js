import { parseResume } from "../utils/resumeParser.js";
import { extractKeywords } from "../utils/keywordExtractor.js";
import { calculateATSScore } from "../utils/atsScore.js";
import { analyzeWithGemini } from "../utils/aiAnalyzer.js";

export const analyzeResume = async (
  req,
  res
) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error:
          "Please upload a PDF resume.",
      });
    }

    const {
      jobDescription,
    } = req.body;

    if (!jobDescription?.trim()) {
      return res.status(400).json({
        success: false,
        error:
          "Please provide a job description.",
      });
    }

    console.log(
      "Resume analysis started"
    );

    // -----------------------------------------
    // PDF extraction
    // -----------------------------------------

    const parseStart =
      Date.now();

    const text =
      await parseResume(
        req.file.buffer
      );

    console.log(
      `PDF parsing completed in ${
        Date.now() - parseStart
      }ms`
    );

    if (
      !text ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        error:
          "No text could be extracted from this PDF.",
      });
    }

    const resumeText =
      text.trim().slice(
        0,
        30000
      );

    // -----------------------------------------
    // ATS score
    // -----------------------------------------

    const jdKeywords =
      extractKeywords(
        jobDescription
      );

    const resumeKeywords =
      extractKeywords(
        resumeText
      );

    const score =
      calculateATSScore(
        jdKeywords,
        resumeKeywords
      );

    console.log(
      "ATS score:",
      score
    );

    // -----------------------------------------
    // Gemini
    // -----------------------------------------

    const aiStart =
      Date.now();

    const report =
      await analyzeWithGemini(
        resumeText,
        jobDescription.trim()
      );

    console.log(
      `Gemini completed in ${
        Date.now() - aiStart
      }ms`
    );

    // -----------------------------------------
    // Final response
    // -----------------------------------------

    return res.json({
      success: true,

      score,

      report: {
        ...report,

        // Use your local ATS score
        // as the main score.
        compatibility_score:
          score,
      },
    });

  } catch (error) {
    console.error(
      "Resume analysis error:",
      error
    );

    return res.status(500).json({
      success: false,
      error:
        error.message ||
        "Resume analysis failed.",
    });
  }
};
