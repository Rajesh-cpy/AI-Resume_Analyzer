import dotenv from "dotenv";

dotenv.config();

const buildPrompt = (resumeText, jobDescription) => `
Analyze this resume against this job description.

Extract:
1. Skills found in the resume
2. Skills required by the job description
3. Skills required by the job but missing from the resume
4. Skills in the resume that are not required by the job
5. ATS optimization tips
6. Overall assessment

Keep the answers concise.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}
`;

const responseSchema = {
  type: "object",

  properties: {
    resume_skills: {
      type: "array",
      items: {
        type: "string",
      },
    },

    job_description_skills: {
      type: "array",
      items: {
        type: "string",
      },
    },

    skills_in_jd_missing_from_resume: {
      type: "array",
      items: {
        type: "string",
      },
    },

    skills_in_resume_not_in_jd: {
      type: "array",
      items: {
        type: "string",
      },
    },

    ats_optimization_tips: {
      type: "array",
      items: {
        type: "string",
      },
    },

    overall_assessment: {
      type: "string",
    },
  },

  required: [
    "resume_skills",
    "job_description_skills",
    "skills_in_jd_missing_from_resume",
    "skills_in_resume_not_in_jd",
    "ats_optimization_tips",
    "overall_assessment",
  ],
};

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

            responseSchema,

            maxOutputTokens: 2000,
          },
        }),
      }
    );

    const data = await response.json();

    console.log(
      "Gemini HTTP status:",
      response.status
    );

    if (!response.ok) {
      console.error(
        "Gemini API Error:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      throw new Error(
        data?.error?.message ||
          `Gemini API returned ${response.status}`
      );
    }

    // -----------------------------------------
    // Check candidate
    // -----------------------------------------

    const candidate =
      data?.candidates?.[0];

    if (!candidate) {
      console.error(
        "No Gemini candidate:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      throw new Error(
        "Gemini did not return a candidate."
      );
    }

    console.log(
      "Gemini finish reason:",
      candidate.finishReason
    );

    // -----------------------------------------
    // Check response text
    // -----------------------------------------

    const rawText =
      candidate?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!rawText) {
      console.error(
        "Gemini returned no text:",
        JSON.stringify(
          data,
          null,
          2
        )
      );

      throw new Error(
        "Gemini returned an empty response."
      );
    }

    console.log(
      "Gemini response length:",
      rawText.length
    );

    // -----------------------------------------
    // Parse JSON
    // -----------------------------------------

    let parsed;

    try {
      parsed = JSON.parse(rawText);
    } catch (error) {
      console.error(
        "JSON parsing failed."
      );

      console.error(
        "Gemini raw response:",
        rawText
      );

      console.error(
        "Finish reason:",
        candidate.finishReason
      );

      throw new Error(
        "Gemini returned invalid JSON."
      );
    }

    // -----------------------------------------
    // Normalize
    // -----------------------------------------

    parsed.resume_skills =
      Array.isArray(
        parsed.resume_skills
      )
        ? parsed.resume_skills
        : [];

    parsed.job_description_skills =
      Array.isArray(
        parsed.job_description_skills
      )
        ? parsed.job_description_skills
        : [];

    parsed.skills_in_jd_missing_from_resume =
      Array.isArray(
        parsed.skills_in_jd_missing_from_resume
      )
        ? parsed.skills_in_jd_missing_from_resume
        : [];

    parsed.skills_in_resume_not_in_jd =
      Array.isArray(
        parsed.skills_in_resume_not_in_jd
      )
        ? parsed.skills_in_resume_not_in_jd
        : [];

    parsed.ats_optimization_tips =
      Array.isArray(
        parsed.ats_optimization_tips
      )
        ? parsed.ats_optimization_tips
        : [];

    parsed.overall_assessment =
      parsed.overall_assessment || "";

    console.log(
      "Gemini analysis successful."
    );

    return parsed;

  } catch (error) {
    if (
      error.name ===
      "AbortError"
    ) {
      throw new Error(
        "Gemini analysis timed out."
      );
    }

    console.error(
      "Gemini error:",
      error.message
    );

    throw error;

  } finally {
    clearTimeout(timeout);
  }
};
