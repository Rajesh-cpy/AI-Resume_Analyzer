import React, { useState } from "react";
import "./index.css";

const YourResumes = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
    setError("");
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) {
      setError("Please select a resume to upload.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the target job description.");
      return;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      setError("You must be logged in.");
      return;
    }

    const formData = new FormData();
    formData.append("resume", selectedFile);

    try {
      setLoading(true);
      setError("");

      // STEP 1: Upload Resume
      const uploadResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/resume/upload`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        throw new Error(errorText || "Resume upload failed.");
      }

      const data = await uploadResponse.json();

      // STEP 2: Analyze Resume
      const rawData = {
        resumeText: data.text,
        jobDescription: jobDescription,
      };

      const analyzeResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/resume/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(rawData),
        }
      );

      if (!analyzeResponse.ok) {
        const errorText = await analyzeResponse.text();
        throw new Error(errorText || "Resume analysis failed.");
      }
      const analyzeData = await analyzeResponse.json();
      setAnalysisResult(analyzeData);
      setShowModal(true);

    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="resume-container">
      <h2>Analyze Your Resume</h2>
      <p className="resume-subtitle">Paste the job description and upload your PDF resume to get a comprehensive ATS score and AI suggestions.</p>

      <div className="upload-card">
        <div className="input-group">
          <label>Target Job Description</label>
          <textarea
            placeholder="Paste the job description here (responsibilities, requirements, etc.)..."
            value={jobDescription}
            onChange={(e) => { setJobDescription(e.target.value); setError(""); }}
            rows={8}
          />
        </div>

        <div className="input-group">
          <label>Your Resume (PDF only)</label>
          <input
            key={selectedFile ? "has-file" : "empty-file"}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="error">{error}</p>}

        <button className="upload-btn" onClick={handleUploadAndAnalyze} disabled={loading}>
          {loading ? (
            <span className="spinner-text">
              <span className="spinner"></span> Processing...
            </span>
          ) : (
            "Upload & Analyze"
          )}
        </button>

        {analysisResult && (
          <button className="view-btn" onClick={() => setShowModal(true)}>
            View Previous Report
          </button>
        )}
      </div>

      {showModal && analysisResult && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>ATS Resume Analysis Report</h2>

            {(() => {
              const report =
                analysisResult.suggestions?.analysis ??
                analysisResult.suggestions ??
                analysisResult;
                
              if (!report) return <p>Could not load report data.</p>;

              return (
                <>
                  <div className="score-badge">
                    <strong>ATS Compatibility Score:</strong>{" "}
                    <span className="score-val">{report?.compatibility_score ?? analysisResult.score ?? "N/A"}%</span>
                  </div>

                  <h3>Resume Skills</h3>
                  <ul>
                    {report?.resume_skills?.length ? report.resume_skills.map((skill, index) => (
                      <li key={index}>{skill}</li>
                    )) : <li>No specific skills extracted.</li>}
                  </ul>

                  <h3>Job Description Skills</h3>
                  <ul>
                    {report?.job_description_skills?.length ? report.job_description_skills.map((skill, index) => (
                      <li key={index}>{skill}</li>
                    )) : <li>No specific skills extracted from JD.</li>}
                  </ul>

                  <h3>Missing Skills (Add to Resume)</h3>
                  <ul>
                    {report?.skills_in_jd_missing_from_resume?.length ? report.skills_in_jd_missing_from_resume.map(
                      (skill, index) => (
                        <li key={index}>{skill}</li>
                      )
                    ) : <li>Great job! You have all the required skills.</li>}
                  </ul>

                  <h3>Extra Skills (Not Required by Job)</h3>
                  <ul>
                    {report?.skills_in_resume_not_in_jd?.length ? report.skills_in_resume_not_in_jd.map(
                      (skill, index) => (
                        <li key={index}>{skill}</li>
                      )
                    ) : <li>No extra skills found.</li>}
                  </ul>

                  <h3>ATS Optimization Tips</h3>
                  <ul>
                    {report?.ats_optimization_tips?.length ? report.ats_optimization_tips.map((tip, index) => (
                      <li key={index}>{typeof tip === 'string' ? tip.replace(/\*\*/g, "") : JSON.stringify(tip)}</li>
                    )) : <li>No optimization tips available.</li>}
                  </ul>

                  <h3>Bullet Point Improvements</h3>
                  {report?.ats_optimized_bullet_point_improvements?.length ? report.ats_optimized_bullet_point_improvements.map(
                    (item, index) => (
                      <div key={index} style={{ marginBottom: "15px" }}>
                        <p>
                          <strong>Original:</strong> {item.original_summary}
                        </p>
                        <p>
                          <strong>Reasoning:</strong> {item.reasoning}
                        </p>
                        <strong>Suggested Bullets:</strong>
                        <ul>
                          {item.suggested_bullets?.map((bullet, i) => (
                            <li key={i}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    )
                  ) : <p>No specific bullet point improvements suggested.</p>}

                  <h3>Overall Assessment</h3>
                  <p>{report?.overall_assessment || "No overall assessment provided."}</p>

                  <button onClick={() => {
                    setShowModal(false);
                    setJobDescription("");
                    setSelectedFile(null);
                    setAnalysisResult(null);
                  }}>Close Report</button>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default YourResumes;