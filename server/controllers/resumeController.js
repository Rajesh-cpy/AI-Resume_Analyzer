import { parseResume } from "../utils/resumeParser.js";
import { extractKeywords } from "../utils/keywordExtractor.js";
import { calculateATSScore } from "../utils/atsScore.js";
import { analyzeWithGemini } from "../utils/aiAnalyzer.js";

export const analyzeResume = async (req, res) => {
  const startTime = Date.now();

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a PDF resume.",
      });
    }

    const { jobDescription } = req.body;

    if (!jobDescription?.trim()) {
      return res.status(400).json({
        success: false,
        error: "Please provide a job description.",
      });
    }

    console.log("Resume analysis started.");

    // -----------------------------
    // PDF
    // -----------------------------

    const parseStart = Date.now();

    const text = await parseResume(
      req.file.buffer
    );

    console.log(
      `PDF parsing: ${
        Date.now() - parseStart
      }ms`
    );

    if (!text?.trim()) {
      return res.status(400).json({
        success: false,
        error:
          "No text could be extracted from this PDF.",
      });
    }

    const resumeText = text
      .trim()
      .slice(0, 30000);

    // -----------------------------
    // ATS
    // -----------------------------

    const jdKeywords =
      extractKeywords(jobDescription);

    const resumeKeywords =
      extractKeywords(resumeText);

    const score =
      calculateATSScore(
        jdKeywords,
        resumeKeywords
      );

    console.log(
      "Local ATS score:",
      score
    );

    // -----------------------------
    // GEMINI
    // -----------------------------

    const aiStart = Date.now();

    const aiReport =
      await analyzeWithGemini(
        resumeText,
        jobDescription.trim()
      );

    console.log(
      `Gemini analysis: ${
        Date.now() - aiStart
      }ms`
    );

    // -----------------------------
    // FINAL RESPONSE
    // -----------------------------

    const finalReport = {
      ...aiReport,

      // Always trust the local ATS calculation
      // for the displayed compatibility score.
      compatibility_score: score,
    };

    console.log(
      "Final report:",
      JSON.stringify(
        finalReport,
        null,
        2
      )
    );

    console.log(
      `TOTAL: ${
        Date.now() - startTime
      }ms`
    );

    return res.json({
      success: true,
      score,
      report: finalReport,
    });

  } catch (error) {
    console.error(
      "Analyze Resume Error:",
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
