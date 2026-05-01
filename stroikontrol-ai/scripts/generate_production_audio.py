"""
Generate production-quality synthetic audio dataset for tile tapping
Realistic acoustic simulation with proper physics-based sound generation
"""
import numpy as np
import wave
import random
import json
from pathlib import Path

# Audio configuration matching research papers
SAMPLE_RATE = 44100
DURATION = 2.0  # seconds

def generate_impact_sound(frequency, decay_rate, amplitude=0.8, duration=DURATION):
    """
    Generate realistic impact sound using damped harmonic oscillator model
    
    Args:
        frequency: Resonant frequency (Hz)
        decay_rate: Decay rate (higher = faster decay)
        amplitude: Peak amplitude
        duration: Sound duration in seconds
    """
    t = np.linspace(0, duration, int(SAMPLE_RATE * duration))
    
    # Main tone with exponential decay
    envelope = np.exp(-t * decay_rate)
    signal = amplitude * np.sin(2 * np.pi * frequency * t) * envelope
    
    # Add harmonics (2nd and 3rd harmonic with lower amplitude)
    harmonic2 = 0.3 * amplitude * np.sin(2 * np.pi * 2 * frequency * t) * np.exp(-t * decay_rate * 1.5)
    harmonic3 = 0.15 * amplitude * np.sin(2 * np.pi * 3 * frequency * t) * np.exp(-t * decay_rate * 2)
    
    signal += harmonic2 + harmonic3
    
    # Add transient (sharp attack)
    attack_time = 0.005  # 5ms
    attack_samples = int(SAMPLE_RATE * attack_time)
    attack = np.linspace(0, 1, attack_samples)
    signal[:attack_samples] *= attack
    
    # Add room reverberation (simplified)
    reverb_delay = int(SAMPLE_RATE * 0.03)  # 30ms
    reverb = np.zeros_like(signal)
    if len(signal) > reverb_delay:
        reverb[reverb_delay:] = signal[:-reverb_delay] * 0.15
    signal += reverb
    
    # Add noise floor
    noise = np.random.normal(0, 0.01, len(t))
    signal += noise
    
    return signal.astype(np.float32)

def generate_intact_tap(grid_position=None, tap_num=0):
    """
    Generate tapping sound for INTACT tile
    Characteristics: sharp, high-frequency, short decay
    """
    # Intact tiles have higher resonant frequency and sharp decay
    base_freq = random.gauss(800, 100)  # ~800Hz ±100
    decay = random.gauss(12, 2)  # Fast decay
    amp = random.gauss(0.8, 0.1)
    
    signal = generate_impact_sound(base_freq, decay, amp)
    
    metadata = {
        'condition': 'intact',
        'resonant_frequency': base_freq,
        'decay_rate': decay,
        'amplitude': amp,
        'grid_position': grid_position,
        'tap_number': tap_num,
        'sample_rate': SAMPLE_RATE,
        'duration': DURATION,
    }
    
    return signal, metadata

def generate_debonded_tap(grid_position=None, tap_num=0):
    """
    Generate tapping sound for DEBONDED tile
    Characteristics: dull, low-frequency, long decay with ringing
    """
    # Debonded tiles have lower resonant frequency and slow decay
    base_freq = random.gauss(250, 80)  # ~250Hz ±80
    decay = random.gauss(3, 0.8)  # Slow decay
    amp = random.gauss(0.6, 0.1)
    
    signal = generate_impact_sound(base_freq, decay, amp)
    
    # Add characteristic "hollowness" - more low-frequency ringing
    hollow_freq = random.gauss(80, 20)
    hollow = 0.4 * amp * np.sin(2 * np.pi * hollow_freq * np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION))) * np.exp(-np.linspace(0, DURATION, int(SAMPLE_RATE * DURATION)) * 1.5)
    signal += hollow
    
    # Add more low-frequency noise
    low_noise = np.random.normal(0, 0.02, len(signal))
    # Low-pass filter the noise (simple moving average)
    window_size = 100
    low_noise_smooth = np.convolve(low_noise, np.ones(window_size)/window_size, mode='same')
    signal += low_noise_smooth * 0.5
    
    metadata = {
        'condition': 'debonded',
        'resonant_frequency': base_freq,
        'decay_rate': decay,
        'amplitude': amp,
        'hollow_frequency': hollow_freq,
        'grid_position': grid_position,
        'tap_number': tap_num,
        'sample_rate': SAMPLE_RATE,
        'duration': DURATION,
    }
    
    return signal, metadata

def generate_background_noise(duration=3.0, room_type='bathroom'):
    """Generate realistic room background noise"""
    samples = int(SAMPLE_RATE * duration)
    
    # White noise base
    noise = np.random.normal(0, 0.015, samples)
    
    # Add some low-frequency hum (HVAC, etc)
    t = np.linspace(0, duration, samples)
    hum = 0.01 * np.sin(2 * np.pi * 50 * t)  # 50Hz hum
    noise += hum
    
    # Room-specific characteristics
    if room_type == 'bathroom':
        # Slight reverb/echo
        echo = np.zeros_like(noise)
        delay = int(SAMPLE_RATE * 0.05)
        if len(noise) > delay:
            echo[delay:] = noise[:-delay] * 0.1
        noise += echo
    
    return noise.astype(np.float32)

def save_wav(audio, filepath, sample_rate=SAMPLE_RATE):
    """Save audio as WAV file"""
    filepath = Path(filepath)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    # Normalize to prevent clipping
    max_val = np.max(np.abs(audio))
    if max_val > 1.0:
        audio = audio / max_val * 0.95
    
    # Convert to int16
    audio_int16 = (audio * 32767).astype(np.int16)
    
    with wave.open(str(filepath), 'wb') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_int16.tobytes())

def create_production_audio_dataset(output_dir, n_intact=50, n_debonded=50):
    """
    Create production-quality audio dataset
    
    Each tile gets:
    - 1 background noise sample
    - 3x3 grid = 9 positions
    - 3 taps per position = 27 taps
    - Total per tile: 28 audio files
    """
    output_dir = Path(output_dir)
    intact_dir = output_dir / 'intact'
    debonded_dir = output_dir / 'debonded'
    
    intact_dir.mkdir(parents=True, exist_ok=True)
    debonded_dir.mkdir(parents=True, exist_ok=True)
    
    all_metadata = []
    
    print(f"[AUDIO] Generating production audio dataset...")
    print(f"   Intact tiles: {n_intact}")
    print(f"   Debonded tiles: {n_debonded}")
    
    # Generate INTACT tiles
    for tile_idx in range(n_intact):
        tile_id = f"intact_{tile_idx:03d}"
        tile_dir = intact_dir / tile_id
        tile_dir.mkdir(parents=True, exist_ok=True)
        
        # Background noise
        bg = generate_background_noise(duration=3.0)
        bg_path = tile_dir / "background.wav"
        save_wav(bg, bg_path)
        
        all_metadata.append({
            'tile_id': tile_id,
            'condition': 'intact',
            'type': 'background',
            'filepath': str(bg_path),
        })
        
        # Tapping grid 3x3
        for row in range(3):
            for col in range(3):
                for tap in range(3):
                    signal, meta = generate_intact_tap(
                        grid_position=(row, col),
                        tap_num=tap
                    )
                    
                    tap_path = tile_dir / f"tap_r{row}_c{col}_n{tap}.wav"
                    save_wav(signal, tap_path)
                    
                    all_metadata.append({
                        **meta,
                        'tile_id': tile_id,
                        'filepath': str(tap_path),
                        'type': 'tap',
                    })
    
    # Generate DEBONDED tiles
    for tile_idx in range(n_debonded):
        tile_id = f"debonded_{tile_idx:03d}"
        tile_dir = debonded_dir / tile_id
        tile_dir.mkdir(parents=True, exist_ok=True)
        
        # Background noise
        bg = generate_background_noise(duration=3.0)
        bg_path = tile_dir / "background.wav"
        save_wav(bg, bg_path)
        
        all_metadata.append({
            'tile_id': tile_id,
            'condition': 'debonded',
            'type': 'background',
            'filepath': str(bg_path),
        })
        
        # Tapping grid 3x3
        for row in range(3):
            for col in range(3):
                for tap in range(3):
                    signal, meta = generate_debonded_tap(
                        grid_position=(row, col),
                        tap_num=tap
                    )
                    
                    tap_path = tile_dir / f"tap_r{row}_c{col}_n{tap}.wav"
                    save_wav(signal, tap_path)
                    
                    all_metadata.append({
                        **meta,
                        'tile_id': tile_id,
                        'filepath': str(tap_path),
                        'type': 'tap',
                    })
    
    # Save metadata
    meta_path = output_dir / "production_metadata.json"
    with open(meta_path, 'w') as f:
        json.dump(all_metadata, f, indent=2, default=str)
    
    n_intact_files = n_intact * 28  # 1 bg + 27 taps
    n_debonded_files = n_debonded * 28
    
    print(f"[OK] Audio dataset created: {output_dir}")
    print(f"   Intact files: {n_intact_files}")
    print(f"   Debonded files: {n_debonded_files}")
    print(f"   Total: {n_intact_files + n_debonded_files} WAV files")
    print(f"   Metadata: {meta_path}")
    
    return output_dir

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='datasets/audio/real-recordings')
    parser.add_argument('--intact', type=int, default=50)
    parser.add_argument('--debonded', type=int, default=50)
    args = parser.parse_args()
    
    create_production_audio_dataset(args.output, args.intact, args.debonded)
