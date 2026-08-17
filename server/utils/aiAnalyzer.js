import dotenv from "dotenv";

dotenv.config();

const buildPrompt = (resumeText, jobDescription) => `
You are an expert ATS resume analyzer.

Analyze the resume against the job description.

Return ONLY valid JSON.

Do not use markdown.
Do not use code fences.
Do not add explanations outside the JSON.

Return this exact JSON structure:

{
  "resume_skills": ["skill1", "skill2"],
  "job_description_skills": ["skill1", "skill2"],
  "skills_in_jd_missing_from_resume": ["skill1", "skill2"],
  "skills_in_resume_not_in_jd": ["skill1", "skill2"],
  "ats_optimization_tips": ["tip1", "tip2"],
  "compatibility_score": 0,
  "overall_assessment": "assessment"
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

  const timeout = setTimeout(() => {
    controller.abort();
  }, 30000);

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is missing."
      );
    }

    console.log("Gemini API key detected.");

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",

        signal: controller.signal,

        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
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
            temperature: 0.1,

            responseMimeType:
              "application/json",

            maxOutputTokens: 4096,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Gemini API Error:",
        JSON.stringify(data, null, 2)
      );

      throw new Error(
        data?.error?.message ||
          `Gemini API returned ${response.status}`
      );
    }

    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    console.log(
      "Gemini response received."
    );

    if (!rawText) {
      console.error(
        "Gemini response:",
        JSON.stringify(data, null, 2)
      );

      throw new Error(
        "Gemini returned an empty response."
      );
    }

    let parsed;

    try {
      parsed = JSON.parse(
        rawText
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim()
      );
    } catch (error) {
      console.error(
        "Gemini returned invalid JSON."
      );

      console.error(
        "Raw response:",
        rawText
      );

      throw new Error(
        "Gemini returned an invalid or incomplete JSON response."
      );
    }

    // -----------------------------------------
    // Validate the important fields
    // -----------------------------------------

    const requiredArrays = [
      "resume_skills",
      "job_description_skills",
      "skills_in_jd_missing_from_resume",
      "skills_in_resume_not_in_jd",
      "ats_optimization_tips",
    ];

    for (const field of requiredArrays) {
      if (!Array.isArray(parsed[field])) {
        parsed[field] = [];
      }
    }

    if (
      typeof parsed.overall_assessment !==
      "string"
    ) {
      parsed.overall_assessment =
        "No overall assessment was generated.";
    }

    if (
      typeof parsed.compatibility_score !==
      "number"
    ) {
      parsed.compatibility_score = 0;
    }

    console.log(
      "Gemini JSON parsed successfully."
    );

    return parsed;

  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(
        "Gemini analysis timed out."
      );
    }

    console.error(
      "Gemini Fatal Error:",
      error.message
    );

    throw error;

  } finally {
    clearTimeout(timeout);
  }
};
