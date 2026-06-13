import os
import modal
import subprocess
import time

image = (
    modal.Image.from_registry("nvidia/cuda:12.2.2-cudnn8-runtime-ubuntu22.04", add_python="3.11")
    .apt_install("ffmpeg")
    .pip_install("faster-whisper==1.0.3", "supabase==2.4.5", "boto3==1.34.101", "requests")
    .pip_install("fastapi[standard]")
)

app = modal.App(name="vidyut-transcriber")

@app.function(
    image=image,
    gpu="T4",
    timeout=1800,
    secrets=[modal.Secret.from_name("vidyut-secrets")]
)
def process_video(project_id: str, s3_key: str):
    import boto3
    from faster_whisper import WhisperModel
    from supabase import create_client, Client

    # Initialize Supabase
    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    supabase: Client = create_client(supabase_url, supabase_key)

    try:
        # Update status to transcribing
        supabase.table("projects").update({"status": "transcribing"}).eq("id", project_id).execute()

        # Download from R2
        r2_account_id = os.environ.get("R2_ACCOUNT_ID")
        r2_access_key = os.environ.get("R2_ACCESS_KEY_ID")
        r2_secret_key = os.environ.get("R2_SECRET_ACCESS_KEY")
        bucket_name = os.environ.get("R2_BUCKET_NAME", "vidyut-media-production")
        
        s3 = boto3.client(
            "s3",
            endpoint_url=f"https://{r2_account_id}.r2.cloudflarestorage.com",
            aws_access_key_id=r2_access_key,
            aws_secret_access_key=r2_secret_key,
            region_name="auto"
        )
        
        local_video_path = f"/tmp/{project_id}_raw.mp4"
        local_audio_path = f"/tmp/{project_id}_audio.wav"
        
        print(f"Downloading {s3_key} from R2...")
        s3.download_file(bucket_name, s3_key, local_video_path)

        # Extract audio using FFmpeg
        print("Extracting audio with FFmpeg...")
        subprocess.run([
            "ffmpeg", "-i", local_video_path,
            "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
            local_audio_path, "-y"
        ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

        import time
        start_time = time.time()
        # Run Faster Whisper
        print("Running Faster Whisper on GPU...")
        model = WhisperModel("large-v3", device="cuda", compute_type="float16")
        segments_gen, info = model.transcribe(
            local_audio_path,
            beam_size=5,
            vad_filter=False,
            word_timestamps=True
        )
        
        language = info.language
        audio_duration = getattr(info, "duration", 0.0)
        all_segments = []
        all_words = []
        segment_diagnostics = []
        
        for segment in segments_gen:
            all_segments.append({
                "id": segment.id,
                "start": segment.start,
                "end": segment.end,
                "text": segment.text
            })
            
            seg_words_in_text = len(segment.text.strip().split())
            seg_words_list = []
            
            if segment.words is not None:
                for word in segment.words:
                    word_data = {
                        "start": word.start,
                        "end": word.end,
                        "word": word.word,
                        "probability": word.probability
                    }
                    all_words.append(word_data)
                    seg_words_list.append(word_data)
            
            segment_diagnostics.append({
                "id": segment.id,
                "start": segment.start,
                "end": segment.end,
                "duration": segment.end - segment.start,
                "text": segment.text,
                "text_word_count": seg_words_in_text,
                "words_list_count": len(seg_words_list)
            })
        
        transcription_time = time.time() - start_time
        
        # 1. Print overview logs
        print(f"--- DIAGNOSTICS OVERVIEW ---")
        print(f"Detected language: {language}")
        print(f"Audio duration: {audio_duration:.2f} seconds")
        print(f"Transcription execution time: {transcription_time:.2f} seconds")
        print(f"Segment count: {len(all_segments)}")
        print(f"Word count: {len(all_words)}")
        avg_words = len(all_words) / len(all_segments) if len(all_segments) > 0 else 0
        print(f"Average words per segment: {avg_words:.2f}")
        
        # 2. Detailed segment logs
        print("\n--- DETAILED SEGMENT LOGS ---")
        for sd in segment_diagnostics:
            print(f"Segment {sd['id']}:")
            print(f"  start: {sd['start']:.2f}")
            print(f"  end: {sd['end']:.2f}")
            print(f"  duration: {sd['duration']:.2f}")
            print(f"  text: {sd['text']}")
            print(f"  words inside text: {sd['text_word_count']}")
            print(f"  words inside words[]: {sd['words_list_count']}")
            
        # 3. Detect timestamp anomalies
        print("\n--- TIMESTAMP ANOMALIES ---")
        
        # Words longer than 3 seconds
        long_words = []
        for w in all_words:
            w_dur = w['end'] - w['start']
            if w_dur > 3.0:
                long_words.append(w)
        print(f"Words longer than 3 seconds (Count: {len(long_words)}):")
        for lw in long_words:
            print(f"  - [{lw['start']:.2f}s -> {lw['end']:.2f}s] (dur: {lw['end'] - lw['start']:.2f}s) word: '{lw['word']}'")
            
        # Segments longer than 15 seconds
        long_segments = []
        for sd in segment_diagnostics:
            if sd['duration'] > 15.0:
                long_segments.append(sd)
        print(f"Segments longer than 15 seconds (Count: {len(long_segments)}):")
        for ls in long_segments:
            print(f"  - [{ls['start']:.2f}s -> {ls['end']:.2f}s] (dur: {ls['duration']:.2f}s) text: '{ls['text']}'")
            
        # Gaps larger than 3 seconds
        # Check segment gaps
        seg_gaps = []
        for i in range(1, len(all_segments)):
            gap = all_segments[i]['start'] - all_segments[i-1]['end']
            if gap > 3.0:
                seg_gaps.append((all_segments[i-1], all_segments[i], gap))
        print(f"Gaps between segments larger than 3 seconds (Count: {len(seg_gaps)}):")
        for prev_seg, curr_seg, gap in seg_gaps:
            print(f"  - {gap:.2f}s gap between Segment {prev_seg['id']} ({prev_seg['end']:.2f}s) and Segment {curr_seg['id']} ({curr_seg['start']:.2f}s)")
            
        # Check word gaps
        word_gaps = []
        for i in range(1, len(all_words)):
            gap = all_words[i]['start'] - all_words[i-1]['end']
            if gap > 3.0:
                word_gaps.append((all_words[i-1], all_words[i], gap))
        print(f"Gaps between words larger than 3 seconds (Count: {len(word_gaps)}):")
        for prev_w, curr_w, gap in word_gaps:
            print(f"  - {gap:.2f}s gap between word '{prev_w['word']}' ({prev_w['end']:.2f}s) and word '{curr_w['word']}' ({curr_w['start']:.2f}s)")
            
        # 4. Word Loss Verification
        total_text_words = sum(sd['text_word_count'] for sd in segment_diagnostics)
        total_words_list = len(all_words)
        mismatch_percent = 0.0
        if total_text_words > 0:
            mismatch_percent = (abs(total_text_words - total_words_list) / total_text_words) * 100
        print("\n--- WORD LOSS VERIFICATION ---")
        print(f"Total words inside segment.text: {total_text_words}")
        print(f"Total words inside words[]: {total_words_list}")
        print(f"Mismatch percentage: {mismatch_percent:.2f}%")

        # Save transcript to transcriptions table
        supabase.table("transcriptions").insert({
            "project_id": project_id,
            "language": language,
            "segments": all_segments,
            "words": all_words
        }).execute()

        # Update project status to ready
        supabase.table("projects").update({"status": "ready"}).eq("id", project_id).execute()
        
        # Cleanup temp files
        if os.path.exists(local_video_path): os.remove(local_video_path)
        if os.path.exists(local_audio_path): os.remove(local_audio_path)

    except Exception as e:
        error_message = str(e)
        print(f"Transcription Failed: {error_message}")
        supabase.table("projects").update({
            "status": "failed",
            # We assume an error_message column exists or we just fail gracefully
            "title": f"[FAILED] {error_message}"[:255] # fallback if column not present
        }).eq("id", project_id).execute()


@app.function(
    image=image,
    secrets=[modal.Secret.from_name("vidyut-secrets")]
)
@modal.fastapi_endpoint(method="POST")
def trigger(data: dict):
    project_id = data.get("project_id")
    s3_key = data.get("s3_key")
    if not project_id or not s3_key:
        return {"error": "Missing project_id or s3_key"}, 400
    
    # Spawn background task
    process_video.spawn(project_id, s3_key)
    return {"status": "started", "project_id": project_id}
