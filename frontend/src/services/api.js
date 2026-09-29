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

export async function generateQuiz(topic, level = "Medium", numQuestions = 5, language = "English") {
  const response = await fetch(`${API_BASE_URL}/quizzes/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic, level, num_questions: numQuestions, language }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Failed to generate customized quiz.");
  }
  return response.json();
}

export async function convertRealImageToFigurine(imageSource, style = "clay_figurine") {
  const formData = new FormData();
  formData.append("style", style);

  if (imageSource instanceof File) {
    formData.append("image_file", imageSource);
  } else if (typeof imageSource === "string") {
    formData.append("image_url", imageSource);
  }

  const response = await fetch(`${API_BASE_URL}/avatar/convert-to-figurine`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to convert image into 3D AI Figurine.");
  }
  return response.json();
}

export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export async function generateAvatarVideo({
  imageSource,
  script,
  language = "en",
  engine = "gtts",
  voiceGender = "male",
  pace = "Medium"
}) {
  const formData = new FormData();
  formData.append("script", script);
  formData.append("language", language);
  formData.append("engine", engine);
  formData.append("voice_gender", voiceGender);
  formData.append("pace", pace);

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
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to render free talking avatar video.");
  }

  const data = await response.json();
  if (data.video_url && !data.video_url.startsWith("http")) {
    data.video_url = `${SERVER_BASE_URL}${data.video_url}`;
  }
  if (data.audio_url && !data.audio_url.startsWith("http")) {
    data.audio_url = `${SERVER_BASE_URL}${data.audio_url}`;
  }
  return data;
}

export async function generateFreeTtsAudio(text, language = "en", engine = "gtts", voiceGender = "male", pace = "Medium") {
  const response = await fetch(`${API_BASE_URL}/avatar/free-tts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      language,
      engine,
      voice_gender: voiceGender,
      pace,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to synthesize free speech audio.");
  }

  const data = await response.json();
  if (data.audio_url && !data.audio_url.startsWith("http")) {
    data.audio_url = `${SERVER_BASE_URL}${data.audio_url}`;
  }
  return data;
}

export async function sendChatMessage(message, history = [], neuroMode = "standard", language = "English") {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      history,
      neuro_mode: neuroMode,
      language
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Guru Ji is momentarily meditating (connection error). Try again!");
  }
  return response.json();
}

export async function updateApiKey(geminiKey) {
  const response = await fetch(`${API_BASE_URL}/config/set-key`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ gemini_api_key: geminiKey }),
  });
  return response.json();
}

export async function speakAvatarText(text, voiceGender = "male", language = "English", pace = "Medium") {
  const response = await fetch(`${API_BASE_URL}/avatar/speak`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      voice_gender: voiceGender,
      language,
      pace
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to synthesize neural speech.");
  }
  return response.json();
}

export async function generateAvatarLecture(topic, language = "English", pace = "Medium") {
  const response = await fetch(`${API_BASE_URL}/avatar/generate-lecture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topic,
      language,
      pace
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate lecture script.");
  }
  return response.json();
}

export async function generateAiFigure(promptOrName, style = "2d_illustrated", gender = "female") {
  const response = await fetch(`${API_BASE_URL}/avatar/generate-figure`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt_or_name: promptOrName,
      style,
      gender,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate AI figure.");
  }

  const data = await response.json();
  if (data.avatar_url && !data.avatar_url.startsWith("http")) {
    data.avatar_url = `${SERVER_BASE_URL}${data.avatar_url}`;
  }
  return data;
}

export async function generateRealisticImage(prompt, geminiApiKey = "", stylePreset = "photorealistic") {
  const response = await fetch(`${API_BASE_URL}/avatar/generate-realistic`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      gemini_api_key: geminiApiKey || undefined,
      style_preset: stylePreset,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to generate realistic AI image.");
  }

  const data = await response.json();
  if (data.avatar_url && !data.avatar_url.startsWith("http")) {
    data.avatar_url = `${SERVER_BASE_URL}${data.avatar_url}`;
  }
  return data;
}


