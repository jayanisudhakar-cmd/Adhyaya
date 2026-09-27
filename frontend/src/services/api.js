const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export async function generateCourse(topic, language = "English", pace = "Medium") {
  const response = await fetch(`${API_BASE_URL}/courses/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic, language, pace }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to generate course syllabus and lessons.");
  }
  return response.json();
}

export async function generateQuiz(topic, level = "Medium", numQuestions = 5) {
  const response = await fetch(`${API_BASE_URL}/quizzes/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic, level, num_questions: numQuestions }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to generate customized quiz.");
  }
  return response.json();
}

export async function generateAvatarVideo(imageSource, script, voiceId = "21m00Tcm4TlvDq8ikWAM") {
  const formData = new FormData();
  formData.append("script", script);
  formData.append("voice_id", voiceId);

  if (imageSource instanceof File) {
    formData.append("image_file", imageSource);
  } else if (typeof imageSource === "string") {
    formData.append("image_url", imageSource);
  }

  const response = await fetch(`${API_BASE_URL}/avatar/generate`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to generate virtual teacher video talk.");
  }
  return response.json();
}
