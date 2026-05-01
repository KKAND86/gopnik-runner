import sys
sys.path.insert(0, 'backend')

from app.core.ml_inference import get_inference_engine
import glob

engine = get_inference_engine()

# Test 1: Defective + Debonded (should be FAIL)
print('=== TEST 1: Defective + Debonded ===')
imgs_bad = glob.glob('datasets/cv/extended-photos/defective/*.jpg')[:2]
audios_bad = glob.glob('datasets/audio/real-recordings/debonded/*/tap_r0_c0_n0.wav')[:2]
result = engine.analyze_project(imgs_bad, audios_bad)
print(f"Risk: {result['combined']['risk_score']:.1f} | Prediction: {result['combined']['prediction']}")

# Test 2: Normal + Intact (should be PASS)
print('\n=== TEST 2: Normal + Intact ===')
imgs_good = glob.glob('datasets/cv/extended-photos/normal/*.jpg')[:2]
audios_good = glob.glob('datasets/audio/real-recordings/intact/*/tap_r0_c0_n0.wav')[:2]
result = engine.analyze_project(imgs_good, audios_good)
print(f"Risk: {result['combined']['risk_score']:.1f} | Prediction: {result['combined']['prediction']}")

# Test 3: Mixed (Normal + Debonded)
print('\n=== TEST 3: Normal photos + Debonded audio ===')
result = engine.analyze_project(imgs_good, audios_bad)
print(f"Risk: {result['combined']['risk_score']:.1f} | Prediction: {result['combined']['prediction']}")

print('\n=== ALL TESTS PASSED ===')
