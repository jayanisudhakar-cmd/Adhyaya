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

    def _detect_face_and_mouth(self, img_bgr: np.ndarray, image_path: str = "") -> Tuple[int, int, int, int]:
        """
        Detects face and determines proportionate, natural mouth coordinates (cx, cy, radius_x, radius_y).
        Ensures the mouth is placed directly on the teacher's lips (NEVER on the neck, sari, collar, or chest!).
        """
        H, W, _ = img_bgr.shape
        fname = os.path.basename(image_path).lower() if image_path else ""

        # 1. Exact Fingerprint Signatures for Known Teacher Figurine Assets
        # Sample corner pixels with tolerance to handle resized or re-encoded images (512, 1024, etc.)
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
            # Exact female figurine mouth center: X=51.0% W, Y=34.7% H (directly on lips, never on sari/chest)
            return int(W * 0.510), int(H * 0.347), max(7, int(W * 0.022)), max(2, int(H * 0.007))
        elif is_male_fig:
            # Exact male figurine mouth center: X=49.5% W, Y=30.8% H (directly on lips, above collar/chest)
            return int(W * 0.495), int(H * 0.308), max(7, int(W * 0.022)), max(2, int(H * 0.007))
        elif any(k in fname for k in ["avatar_2d_priya", "avatar_2d_kabir", "avatar_2d_ananya", "avatar_2d_rohan"]):
            return int(W * 0.50), int(H * 0.52), max(7, int(W * 0.030)), max(2, int(H * 0.009))

        # 2. Dynamic Face Detection with Strict Upper-Body Bias (rejecting false detections on torso/chest)
        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=4,
            minSize=(int(W * 0.16), int(H * 0.16))
        )

        # Retain only faces located strictly in the upper portion of the portrait (fy < H * 0.36)
        valid_faces = [f for f in faces if f[1] < H * 0.36]
        if len(valid_faces) > 0:
            fx, fy, fw, fh = max(valid_faces, key=lambda f: f[2] * f[3])
            cx = fx + fw // 2

            # Auto-detect oral fissure (dark seam line between lips)
            y_start = fy + int(fh * 0.65)
            y_end = min(H, fy + int(fh * 0.82))
            col_slice = gray[y_start:y_end, max(0, cx - 6):min(W, cx + 7)]
            if col_slice.size > 0:
                row_intensities = np.mean(col_slice, axis=1)
                cy = y_start + int(np.argmin(row_intensities))
            else:
                cy = fy + int(fh * 0.74)

            # Strict anatomical clamp: lips never exceed 0.48 * H on portraits
            cy = min(cy, int(H * 0.48))
            rx = max(8, int(fw * 0.082))
            ry = max(2, int(fh * 0.016))
            return cx, cy, rx, ry

        # 3. Eye Cascade Fallback (for stylized/3D art where face cascade misses)
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
            cy = min(int(H * 0.46), eye_cy + int(eye_dist * 0.70))
            rx = max(7, int(eye_dist * 0.26))
            ry = max(2, int(eye_dist * 0.06))
            return cx, cy, rx, ry

        # 4. Standard Anatomical Portrait Mouth Fallback (strict upper third at Y = 0.34 H, NEVER chest)
        cx = W // 2
        cy = int(H * 0.34)
        rx = max(7, int(W * 0.024))
        ry = max(2, int(H * 0.007))

        return cx, cy, rx, ry

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
        cx, cy, rx, ry = self._detect_face_and_mouth(img, image_path=image_path)

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

                # 3. Render proportionate animated mouth with feathered alpha blending
                if smooth_k > 0.035:
                    # Natural conversational opening: horizontal width remains stable, vertical opening expands subtly
                    cur_rx = int(rx * 0.95)
                    cur_ry = max(1, int(ry * (0.30 + 0.70 * smooth_k)))

                    # Extract local patch around mouth
                    x1 = max(0, cur_cx - cur_rx - 5)
                    x2 = min(target_w, cur_cx + cur_rx + 5)
                    y1 = max(0, cur_cy - cur_ry - 5)
                    y2 = min(target_h, cur_cy + cur_ry + 5)

                    if x2 > x1 and y2 > y1:
                        patch = frame[y1:y2, x1:x2].astype(np.float32)
                        ph, pw, _ = patch.shape

                        # Soft feathered alpha mask with Gaussian smoothing
                        mask = np.zeros((ph, pw), dtype=np.float32)
                        pcx = cur_cx - x1
                        pcy = cur_cy - y1
                        cv2.ellipse(mask, (pcx, pcy), (cur_rx, cur_ry), 0, 0, 360, 1.0, -1)
                        mask = cv2.GaussianBlur(mask, (5, 5), 1.2)

                        # Natural oral cavity tone: warm burgundy/rose mucosa (harmonizes with teacher's face)
                        cavity = np.zeros_like(patch)
                        cavity[:, :] = (
                            max(24.0, lip_color[0] * 0.45),
                            max(18.0, lip_color[1] * 0.35),
                            max(35.0, lip_color[2] * 0.50)
                        )

                        # Delicate teeth hint only on wider enunciations
                        if smooth_k > 0.45:
                            teeth_mask = np.zeros((ph, pw), dtype=np.float32)
                            tw = max(4, int(cur_rx * 0.50))
                            th = max(1, int(cur_ry * 0.22))
                            cv2.ellipse(teeth_mask, (pcx, pcy - cur_ry + th + 1), (tw, th), 0, 0, 180, 1.0, -1)
                            teeth_mask = cv2.GaussianBlur(teeth_mask, (3, 3), 0.8)
                            teeth_color = np.array([218, 220, 224], dtype=np.float32)
                            for c in range(3):
                                cavity[:, :, c] = cavity[:, :, c] * (1.0 - teeth_mask * 0.60) + teeth_color[c] * (teeth_mask * 0.60)

                        # Feathered alpha blend onto frame
                        alpha = np.expand_dims(mask, axis=2) * (0.65 + 0.15 * smooth_k)
                        blended = patch * (1.0 - alpha) + cavity * alpha
                        frame[y1:y2, x1:x2] = np.clip(blended, 0, 255).astype(np.uint8)

                        # Subtle lower lip shadow contour
                        if cur_ry >= 2:
                            cv2.ellipse(frame, (cur_cx, cur_cy + cur_ry), (int(cur_rx * 0.70), 1), 0, 0, 180, (
                                int(max(15.0, lip_color[0] * 0.70)),
                                int(max(15.0, lip_color[1] * 0.65)),
                                int(max(25.0, lip_color[2] * 0.75))
                            ), 1)

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
