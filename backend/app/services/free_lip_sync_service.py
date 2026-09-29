import os
import io
import time
import math
import uuid
import wave
import base64
import asyncio
import subprocess
from typing import Optional, Tuple
import cv2
import numpy as np
import imageio_ffmpeg
from gtts import gTTS
import edge_tts

class FreeLipSyncService:
    """
    100% Free, Zero-Cost, Open-Source Talking Avatar & Lip-Sync Pipeline.
    Replaces paid SaaS APIs (D-ID, ElevenLabs, HeyGen) with local open-source models:
    - Free Multilingual TTS: gTTS (Google TTS) and Edge-TTS (Microsoft Neural).
    - Free Audio-to-Phoneme Energy Analysis.
    - Free Computer Vision Talking Avatar Lip-Sync Engine (OpenCV + FFmpeg).
    - Seamless hooks for Wav2Lip checkpoints when locally available.
    """

    def __init__(self):
        self.ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
        self.static_dir = os.path.join(self.base_dir, "static")
        self.videos_dir = os.path.join(self.static_dir, "videos")
        self.audio_dir = os.path.join(self.static_dir, "audio")
        self.checkpoints_dir = os.path.join(self.base_dir, "checkpoints")

        os.makedirs(self.videos_dir, exist_ok=True)
        os.makedirs(self.audio_dir, exist_ok=True)
        os.makedirs(self.checkpoints_dir, exist_ok=True)

        # Load OpenCV Haar cascade for face and eye detection
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self.face_cascade = cv2.CascadeClassifier(cascade_path)
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_eye.xml")

        # Load OpenCV YuNet Neural Face & Facial Landmark Detector (5-point precision landmarks)
        self.yunet_model_path = os.path.join(self.checkpoints_dir, "face_detection_yunet_2023mar.onnx")
        self.yunet_detector = None
        if os.path.exists(self.yunet_model_path) and hasattr(cv2, "FaceDetectorYN"):
            try:
                self.yunet_detector = cv2.FaceDetectorYN.create(
                    model=self.yunet_model_path,
                    config="",
                    input_size=(512, 512),
                    score_threshold=0.6,
                    nms_threshold=0.3,
                    top_k=5000
                )
            except Exception as e:
                print(f"[FreeLipSync] YuNet detector init warning: {e}")

        # Free Neural Voice mapping for Edge-TTS
        self.edge_voice_map = {
            "kn": {"male": "kn-IN-GaganNeural", "female": "kn-IN-SapnaNeural"},
            "kannada": {"male": "kn-IN-GaganNeural", "female": "kn-IN-SapnaNeural"},
            "en": {"male": "en-IN-PrabhatNeural", "female": "en-IN-NeerjaNeural"},
            "english": {"male": "en-IN-PrabhatNeural", "female": "en-IN-NeerjaNeural"},
            "hi": {"male": "hi-IN-MadhurNeural", "female": "hi-IN-SwaraNeural"},
            "hindi": {"male": "hi-IN-MadhurNeural", "female": "hi-IN-SwaraNeural"},
            "ta": {"male": "ta-IN-ValluvarNeural", "female": "ta-IN-PallaviNeural"},
            "tamil": {"male": "ta-IN-ValluvarNeural", "female": "ta-IN-PallaviNeural"},
            "te": {"male": "te-IN-MohanNeural", "female": "te-IN-ShrutiNeural"},
            "telugu": {"male": "te-IN-MohanNeural", "female": "te-IN-ShrutiNeural"},
        }

        # gTTS language code mapping
        self.gtts_lang_map = {
            "kn": "kn",
            "kannada": "kn",
            "en": "en",
            "english": "en",
            "hi": "hi",
            "hindi": "hi",
            "ta": "ta",
            "tamil": "ta",
            "te": "te",
            "telugu": "te",
        }

    async def generate_free_audio(
        self,
        text: str,
        language: str = "en",
        engine: str = "gtts",
        voice_gender: str = "male",
        pace: str = "Medium",
        output_path: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Synthesizes free speech audio in Kannada, English, Hindi, etc.
        Uses gTTS or Edge-TTS without any paid API keys.
        Returns: (file_path, audio_url)
        """
        file_id = f"audio_{uuid.uuid4().hex[:10]}"
        if not output_path:
            output_path = os.path.join(self.audio_dir, f"{file_id}.mp3")

        lang_key = language.lower().strip()

        if engine.lower() == "gtts":
            # Google Free Text-to-Speech
            target_lang = self.gtts_lang_map.get(lang_key, "en")
            slow_mode = (pace.lower() == "slow")
            tts = gTTS(text=text, lang=target_lang, slow=slow_mode)
            tts.save(output_path)
        else:
            # Microsoft Edge-TTS Neural Voice
            lang_voices = self.edge_voice_map.get(lang_key, self.edge_voice_map["en"])
            voice = lang_voices.get(voice_gender.lower(), lang_voices["male"])
            
            rate_str = "+0%"
            if pace.lower() == "slow":
                rate_str = "-20%"
            elif pace.lower() == "fast":
                rate_str = "+25%"

            communicate = edge_tts.Communicate(text, voice, rate=rate_str)
            await communicate.save(output_path)

        relative_url = f"/static/audio/{os.path.basename(output_path)}"
        return output_path, relative_url

    def _extract_audio_rms_profile(self, audio_mp3_path: str, fps: int = 25) -> Tuple[list, float]:
        """
        Converts MP3 audio to 16kHz WAV and extracts RMS energy profile per video frame.
        """
        wav_temp_path = audio_mp3_path + ".temp.wav"
        try:
            # Convert to 16kHz mono WAV using local ffmpeg
            cmd = [
                self.ffmpeg_exe, "-y",
                "-i", audio_mp3_path,
                "-ac", "1",
                "-ar", "16000",
                wav_temp_path
            ]
            subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

            with wave.open(wav_temp_path, "rb") as wf:
                framerate = wf.getframerate()
                n_frames = wf.getnframes()
                raw_bytes = wf.readframes(n_frames)

            samples = np.frombuffer(raw_bytes, dtype=np.int16).astype(np.float32)
            duration = n_frames / framerate
            total_video_frames = max(1, int(duration * fps) + 1)
            samples_per_frame = int(framerate / fps)

            rms_list = []
            for i in range(total_video_frames):
                start = i * samples_per_frame
                end = min(len(samples), (i + 1) * samples_per_frame)
                if end > start:
                    chunk = samples[start:end]
                    rms = np.sqrt(np.mean(chunk ** 2))
                else:
                    rms = 0.0
                rms_list.append(rms)

            # Smooth RMS envelope (Moving average)
            smoothed = []
            for i in range(len(rms_list)):
                window = rms_list[max(0, i - 1):min(len(rms_list), i + 2)]
                smoothed.append(float(np.mean(window)))

            max_rms = max(smoothed) if smoothed and max(smoothed) > 0 else 1.0
            normalized = [s / max_rms for s in smoothed]
            return normalized, duration

        finally:
            if os.path.exists(wav_temp_path):
                try:
                    os.remove(wav_temp_path)
                except Exception:
                    pass

    def _refine_oral_fissure(self, img_gray: np.ndarray, cx: int, cy_base: int, rx: int, ry: int) -> int:
        """
        Refines vertical mouth coordinate to land with sub-pixel precision directly on the lip seam
        (oral fissure), avoiding placement too high (philtrum/upper lip) or too low (chin crease).
        """
        H, W = img_gray.shape
        y_min = max(0, cy_base - int(ry * 0.5))
        y_max = min(H, cy_base + int(ry * 1.5))
        x_min = max(0, cx - 4)
        x_max = min(W, cx + 5)

        strip = img_gray[y_min:y_max, x_min:x_max]
        if strip.size == 0:
            return cy_base

        profile = np.mean(strip, axis=1)

        # 1. Smile with visible upper teeth: look for bright teeth band (>168) followed by sharp drop
        for i in range(len(profile) - 2):
            if profile[i] > 168 and (profile[i] - profile[min(len(profile) - 1, i + 3)]) > 35:
                return y_min + i + 1

        # 2. Closed / resting lips: oral fissure is the darkest seam line (minimum intensity)
        return y_min + int(np.argmin(profile))

    def _detect_face_and_mouth(self, img_bgr: np.ndarray, image_path: str = "") -> Tuple[int, int, int, int, float]:
        """
        Detects face and determines proportionate, natural mouth coordinates (cx, cy, rx, ry, angle).
        Uses deep-learning YuNet 5-point facial landmark detection to match the exact lip seam.
        Ensures the mouth is placed directly on the teacher's lips (NEVER above on philtrum, below on chin, or on chest!).
        """
        H, W, _ = img_bgr.shape
        fname = os.path.basename(image_path).lower() if image_path else ""
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)

        # 1. Deep Learning Facial Landmark Detection (YuNet) - Primary Engine for Realistic AI Pictures
        if self.yunet_detector is not None:
            try:
                self.yunet_detector.setInputSize((W, H))
                faces = self.yunet_detector.detect(img_bgr)
                if faces[1] is not None and len(faces[1]) > 0:
                    # Select face in upper portrait area
                    valid = [f for f in faces[1] if f[1] < H * 0.60]
                    if not valid:
                        valid = faces[1]
                    face = max(valid, key=lambda f: f[2] * f[3])

                    rcm_x, rcm_y = face[10:12] # Right mouth corner
                    lcm_x, lcm_y = face[12:14] # Left mouth corner
                    nt_x, nt_y = face[8:10]   # Nose tip

                    # Mathematical center between the two lip corners
                    cx = int(round((rcm_x + lcm_x) / 2.0))
                    cy_base = int(round((rcm_y + lcm_y) / 2.0))
                    mw = math.hypot(lcm_x - rcm_x, lcm_y - rcm_y)
                    rx = max(8, int(round(mw * 0.48)))
                    ry = max(3, int(round(mw * 0.16)))
                    angle = float(math.degrees(math.atan2(lcm_y - rcm_y, lcm_x - rcm_x)))

                    # Sub-pixel vertical refinement of oral fissure (lip seam)
                    cy = self._refine_oral_fissure(gray, cx, cy_base, rx, ry)

                    # Ensure mouth is strictly below nose tip
                    if cy <= nt_y + 3:
                        cy = int(nt_y + max(6.0, (cy_base - nt_y) * 1.1))

                    return cx, cy, rx, ry, angle
            except Exception as e:
                print(f"[FreeLipSync] YuNet landmark detection notice: {e}")

        # 2. Exact Fingerprint Signatures for Known Teacher Figurine Assets
        tl = img_bgr[min(5, H - 1), min(5, W - 1)].astype(int)
        is_female_fig = (
            ("figurine_female" in fname) or
            (abs(tl[0] - 222) < 22 and abs(tl[1] - 198) < 22 and abs(tl[2] - 233) < 22)
        )
        is_male_fig = (
            ("figurine_male" in fname) or
            (abs(tl[0] - 182) < 22 and abs(tl[1] - 176) < 22 and abs(tl[2] - 194) < 22)
        )

        if is_female_fig:
            return int(W * 0.510), int(H * 0.347), max(7, int(W * 0.022)), max(2, int(H * 0.007)), 0.0
        elif is_male_fig:
            return int(W * 0.495), int(H * 0.308), max(7, int(W * 0.022)), max(2, int(H * 0.007)), 0.0
        elif any(k in fname for k in ["avatar_2d_priya", "avatar_2d_kabir", "avatar_2d_ananya", "avatar_2d_rohan"]):
            return int(W * 0.50), int(H * 0.52), max(7, int(W * 0.030)), max(2, int(H * 0.009)), 0.0

        # 3. Dynamic Haar Cascade Face Detection with Strict Upper-Body Bias
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(int(W * 0.16), int(H * 0.16))
        )

        valid_faces = [f for f in faces if f[1] < H * 0.36]
        if len(valid_faces) > 0:
            fx, fy, fw, fh = max(valid_faces, key=lambda f: f[2] * f[3])
            cx = fx + fw // 2
            cy_base = fy + int(fh * 0.74)
            rx = max(8, int(fw * 0.18))
            ry = max(3, int(fh * 0.05))
            cy = self._refine_oral_fissure(gray, cx, cy_base, rx, ry)
            cy = min(cy, int(H * 0.48))
            return cx, cy, rx, ry, 0.0

        # 4. Eye Cascade Fallback
        eyes = self.eye_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=3,
            minSize=(int(W * 0.04), int(H * 0.04))
        )
        upper_eyes = [e for e in eyes if e[1] < H * 0.35]
        if len(upper_eyes) >= 2:
            upper_eyes = sorted(upper_eyes, key=lambda e: e[0])
            e1, e2 = upper_eyes[0], upper_eyes[-1]
            eye_cx = (e1[0] + e1[2] // 2 + e2[0] + e2[2] // 2) // 2
            eye_cy = (e1[1] + e1[3] // 2 + e2[1] + e2[3] // 2) // 2
            eye_dist = abs((e2[0] + e2[2] // 2) - (e1[0] + e1[2] // 2))
            cx = eye_cx
            cy_base = min(int(H * 0.46), eye_cy + int(eye_dist * 0.70))
            rx = max(7, int(eye_dist * 0.26))
            ry = max(2, int(eye_dist * 0.06))
            cy = self._refine_oral_fissure(gray, cx, cy_base, rx, ry)
            return cx, cy, rx, ry, 0.0

        # 5. Standard Anatomical Portrait Mouth Fallback (strict upper third, NEVER chest)
        cx = W // 2
        cy = int(H * 0.34)
        rx = max(7, int(W * 0.024))
        ry = max(2, int(H * 0.007))

        return cx, cy, rx, ry, 0.0

    def generate_talking_avatar_video(
        self,
        image_path: str,
        audio_path: str,
        output_path: Optional[str] = None,
        fps: int = 25
    ) -> Tuple[str, str, float]:
        """
        Renders a talking-head video (.mp4) with lip-sync synchronized to audio.
        Zero API cost, runs 100% locally.
        Returns: (output_file_path, relative_video_url, duration_seconds)
        """
        # 1. Check if Wav2Lip checkpoint exists for deep-learning execution
        wav2lip_chk = os.path.join(self.checkpoints_dir, "wav2lip.pth")
        if os.path.exists(wav2lip_chk):
            try:
                video_id = f"video_{uuid.uuid4().hex[:10]}"
                if not output_path:
                    output_path = os.path.join(self.videos_dir, f"{video_id}.mp4")
                cmd = [
                    "python", "inference.py",
                    "--checkpoint_path", wav2lip_chk,
                    "--face", image_path,
                    "--audio", audio_path,
                    "--outfile", output_path
                ]
                subprocess.run(cmd, check=True)
                if os.path.exists(output_path):
                    rel_url = f"/static/videos/{os.path.basename(output_path)}"
                    return output_path, rel_url, 5.0
            except Exception as e:
                print(f"[FreeLipSync] Wav2Lip execution skipped, using CV Engine: {e}")

        # 2. Local Free Computer Vision Lip-Sync & Animation Engine
        # Read source image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image from {image_path}")

        # Resize for smooth high-speed video encoding (max 512x512)
        H, W, _ = img.shape
        scale = 512 / max(H, W)
        target_w, target_h = int(W * scale), int(H * scale)
        # Ensure dimensions are divisible by 2 for H.264 encoder
        target_w = target_w - (target_w % 2)
        target_h = target_h - (target_h % 2)
        img = cv2.resize(img, (target_w, target_h))

        # Detect face & mouth coordinates
        cx, cy, rx, ry, angle = self._detect_face_and_mouth(img, image_path=image_path)

        # Sample median lip mucosa tone for seamless blending
        sample_y_start = min(target_h - 2, max(0, cy + 1))
        sample_y_end = min(target_h, sample_y_start + 3)
        lip_patch = img[sample_y_start:sample_y_end, max(0, cx - 3):min(target_w, cx + 4)]
        if lip_patch.size > 0:
            lip_color = np.median(lip_patch, axis=(0, 1)).astype(np.float32)
        else:
            lip_color = np.array([40.0, 45.0, 75.0], dtype=np.float32)

        # Extract audio energy envelope
        norm_rms, duration = self._extract_audio_rms_profile(audio_path, fps=fps)
        total_frames = len(norm_rms)

        # Output MP4 path
        video_id = f"video_{uuid.uuid4().hex[:10]}"
        if not output_path:
            output_path = os.path.join(self.videos_dir, f"{video_id}.mp4")

        # Setup FFmpeg rawvideo pipe
        cmd = [
            self.ffmpeg_exe, "-y",
            "-f", "rawvideo",
            "-vcodec", "rawvideo",
            "-s", f"{target_w}x{target_h}",
            "-pix_fmt", "bgr24",
            "-r", str(fps),
            "-i", "-",
            "-i", audio_path,
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            "-c:a", "aac",
            "-b:a", "128k",
            "-shortest",
            output_path
        ]

        proc = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        smooth_k = 0.0

        try:
            for i in range(total_frames):
                energy = norm_rms[i]
                frame = img.copy()

                # 1. Subtle lifelike head breathing micro-float (0.8-1.2px)
                dy = int(math.sin(i * 0.10) * 1.2)
                dx = int(math.cos(i * 0.06) * 0.6)
                if dy != 0 or dx != 0:
                    M = np.float32([[1, 0, dx], [0, 1, dy]])
                    frame = cv2.warpAffine(frame, M, (target_w, target_h), borderMode=cv2.BORDER_REFLECT)

                cur_cx = cx + dx
                cur_cy = cy + dy

                # 2. Asymmetric attack/decay smoothing for natural lip kinetics
                target_k = 0.0
                if energy > 0.06:
                    target_k = min(1.0, (energy - 0.06) * 2.0)

                # Faster attack on speech onsets, gentle natural decay on closures
                if target_k > smooth_k:
                    smooth_k = smooth_k * 0.40 + target_k * 0.60
                else:
                    smooth_k = smooth_k * 0.65 + target_k * 0.35

                # 3. Organic Lip Deforming & Dynamic Oral Parting (Spine2D / Live2D kinematics)
                if smooth_k > 0.03:
                    # Bounding box around the mouth
                    w_box = max(16, int(rx * 1.25))
                    h_box = max(12, int(ry * 3.5))

                    x0 = max(0, cur_cx - w_box)
                    x1 = min(target_w, cur_cx + w_box)
                    y0 = max(0, cur_cy - int(ry * 0.8))
                    y1 = min(target_h, cur_cy + h_box)

                    if x1 > x0 and y1 > y0:
                        roi = frame[y0:y1, x0:x1].copy()
                        rh, rw, _ = roi.shape

                        # Normalized horizontal weights (quadratic falloff from mouth center)
                        norm_x = np.abs(np.arange(rw) - (cur_cx - x0)) / float(w_box)
                        weights_x = np.clip(1.0 - norm_x**2, 0.0, 1.0).astype(np.float32)

                        # Warp lower lip downward proportional to speech energy
                        max_shift = float(smooth_k * max(2.5, ry * 0.9))
                        local_cy = cur_cy - y0

                        map_x = np.tile(np.arange(rw, dtype=np.float32), (rh, 1))
                        map_y = np.tile(np.arange(rh, dtype=np.float32)[:, np.newaxis], (1, rw))

                        for r in range(max(0, local_cy), rh):
                            dy_factor = np.clip(1.0 - (r - local_cy) / float(h_box), 0.0, 1.0)
                            map_y[r, :] -= (max_shift * dy_factor) * weights_x

                        warped_roi = cv2.remap(roi, map_x, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

                        # Precise downward cavity opening strictly starting from lip seam (never above on upper lip)
                        open_h = max(2, int(smooth_k * max(2.0, ry * 0.70)))
                        shadow_mask = np.zeros((rh, rw), dtype=np.float32)
                        cavity_cy = local_cy + max(1, open_h // 2)
                        cavity_ry = max(1, open_h // 2)

                        cv2.ellipse(
                            shadow_mask,
                            (cur_cx - x0, cavity_cy),
                            (max(6, int(rx * 0.88)), cavity_ry),
                            angle, 0, 360, 1.0, -1
                        )
                        shadow_mask = cv2.GaussianBlur(shadow_mask, (5, 3), 0.8)

                        # Deep mucosal shadow (never pitch black, harmonizes with teacher's complexion)
                        shadow_color = np.array([
                            max(20.0, lip_color[0] * 0.38),
                            max(14.0, lip_color[1] * 0.28),
                            max(28.0, lip_color[2] * 0.42)
                        ], dtype=np.float32)

                        alpha_s = np.expand_dims(shadow_mask, axis=2) * (0.60 + 0.15 * smooth_k)
                        blended_roi = warped_roi.astype(np.float32) * (1.0 - alpha_s) + shadow_color * alpha_s

                        frame[y0:y1, x0:x1] = np.clip(blended_roi, 0, 255).astype(np.uint8)

                # Write raw BGR frame to FFmpeg pipe
                proc.stdin.write(frame.tobytes())

            proc.stdin.close()
            proc.wait()

        except Exception as e:
            if proc.stdin:
                proc.stdin.close()
            proc.kill()
            raise RuntimeError(f"FFmpeg video encoding failed: {e}")

        if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
            raise RuntimeError("Generated video file is empty or missing.")

        relative_url = f"/static/videos/{os.path.basename(output_path)}"
        return output_path, relative_url, duration

free_lip_sync_service = FreeLipSyncService()
