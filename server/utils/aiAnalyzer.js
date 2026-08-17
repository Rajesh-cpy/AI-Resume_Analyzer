import dotenv from "dotenv";

dotenv.config();

const buildPrompt = (
  resumeText,
  jobDescription
) => `
You are an ATS resume analyzer.

Return STRICT JSON only.
Do not wrap in markdown.
Do not include backticks.
Do not include explanations outside the JSON.

Use this exact schema:

{
  "success": true,
  "analysis": {
    "resume_skills": [],
    "job_description_skills": [],
    "skills_in_jd_missing_from_resume": [],
    "skills_in_resume_not_in_jd": [],
    "ats_optimized_bullet_point_improvements": [
      {
        "original_summary": "",
        "suggested_bullets": [],
        "reasoning": ""
      }
    ],
    "ats_optimization_tips": [],
    "compatibility_score": 0,
    "overall_assessment": ""
  }
}

Resume:
${resumeText}

Job Description:
${jobDescription}
`;

export const analyzeWithGemini = async (
  resumeText,
  jobDescription
) => {
  const controller = new AbortController();

  // Stop waiting after 30 seconds.
  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error(
        "GEMINI_API_KEY is undefined"
      );
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",

        signal: controller.signal,

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key":
            process.env.GEMINI_API_KEY,
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: buildPrompt(
                    resumeText,
                    jobDescription
                  ),
                },
              ],
            },
          ],

          generationConfig: {
            temperature: 0.2,

            responseMimeType:
              "application/json",

            maxOutputTokens: 2500,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API Error:",
        data
      );

      throw new Error(
        data?.error?.message ||
          "Gemini API request failed."
      );
    }

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      throw new Error(
        "Empty Gemini response."
      );
    }

    try {
      return JSON.parse(
        rawText
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()
      );
    } catch {
      console.warn(
        "Gemini returned invalid JSON."
      );

      return {
        success: false,
        raw_model_output: rawText,
      };
    }

  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        "AI analysis timed out. Please try again."
      );
    }

    console.error(
      "Gemini Fatal Error:",
      err.message
    );

    throw err;

  } finally {
    clearTimeout(timeout);
  }
};
