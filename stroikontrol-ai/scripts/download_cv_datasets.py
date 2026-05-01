"""
Download CV datasets for tile defect detection
Usage: python scripts/download_cv_datasets.py --roboflow-api-key YOUR_KEY
"""
import os
import sys
import argparse
import zipfile
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
DATASETS_DIR = BASE_DIR / "datasets" / "cv"

def download_roboflow_ceramic(api_key: str):
    """Download ceramic-tile-defects from Roboflow Universe"""
    print("[DOWNLOAD] Downloading Roboflow ceramic-tile-defects dataset...")
    
    try:
        from roboflow import Roboflow
        rf = Roboflow(api_key=api_key)
        project = rf.workspace("liverpool-university-tz6eh").project("ceramic-tile-defects")
        dataset = project.version(1).download("yolov8", location=str(DATASETS_DIR / "roboflow-ceramic"))
        print(f"[OK] Roboflow dataset downloaded to: {dataset.location}")
        return dataset.location
    except Exception as e:
        print(f"[ERROR] Error downloading from Roboflow: {e}")
        print("   Get API key at: https://app.roboflow.com")
        return None

def download_mendeley_ceramics():
    """Download ceramics-defects-detection from Mendeley Data"""
    print("[DOWNLOAD] Downloading Mendeley ceramics-defects-detection dataset...")
    
    target_dir = DATASETS_DIR / "mendeley-ceramics"
    target_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"""
    [!] Mendeley dataset requires manual download:
    
    1. Visit: https://data.mendeley.com/datasets/47x6jdbr5j/1
    2. Click "Download dataset" (1600 images, 4096x3072)
    3. Extract to: {target_dir}
    
    Expected structure:
        {target_dir}/
        ├── database/
        │   ├── amostra/           # Original 1600 images
        │   │   ├── normal/        # 800 images
        │   │   └── defective/     # 800 images
        │   └── amostra_processada/  # Augmented 7000 images
        └── README.md
    """)
    
    readme = target_dir / "README.md"
    if not readme.exists():
        readme.write_text("""# Mendeley Ceramics Defects Dataset

- **DOI**: 10.17632/47x6jdbr5j.1
- **Source**: https://data.mendeley.com/datasets/47x6jdbr5j/1
- **Classes**: normal (800), defective (800)
- **Resolution**: 4096x3072 pixels
- **Augmented**: 7000 images (5x via Albumentations)

## Download Instructions
1. Visit the Mendeley Data link above
2. Download the ZIP archive
3. Extract contents to this folder

## Citation
Aquino do Nascimento, Lucileide; Paulo, Otilio; Moreira da Paz, Gilvan; Rodrigues Machado da Silva, Micherlane (2025), 
"ceramics-defects-detection", Mendeley Data, V1, doi: 10.17632/47x6jdbr5j.1
""")
    
    return str(target_dir)

def prepare_roboflow_dataset(dataset_path: str):
    """Convert Roboflow YOLO format to standardized structure"""
    print(f"[PREP] Preparing Roboflow dataset from {dataset_path}...")
    
    import yaml
    import shutil
    
    path = Path(dataset_path)
    
    data_yaml = path / "data.yaml"
    if not data_yaml.exists():
        print("[ERROR] data.yaml not found")
        return None
    
    with open(data_yaml) as f:
        config = yaml.safe_load(f)
    
    classes = config.get('names', [])
    print(f"   Classes: {classes}")
    
    output_dir = DATASETS_DIR / "cv-standard"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for split in ['train', 'valid', 'test']:
        src_images = path / split / 'images'
        src_labels = path / split / 'labels'
        
        if src_images.exists():
            dst_images = output_dir / split / 'images'
            dst_labels = output_dir / split / 'labels'
            dst_images.mkdir(parents=True, exist_ok=True)
            dst_labels.mkdir(parents=True, exist_ok=True)
            
            for img in src_images.glob('*'):
                shutil.copy2(img, dst_images / img.name)
            for lbl in src_labels.glob('*'):
                shutil.copy2(lbl, dst_labels / lbl.name)
            
            img_count = len(list(dst_images.glob('*')))
            lbl_count = len(list(dst_labels.glob('*')))
            print(f"   {split}: {img_count} images, {lbl_count} labels")
    
    import json
    meta = {
        'source': 'roboflow-ceramic-tile-defects',
        'classes': classes,
        'format': 'yolo',
        'path': str(output_dir)
    }
    with open(output_dir / 'meta.json', 'w') as f:
        json.dump(meta, f, indent=2)
    
    print(f"[OK] Standardized dataset at: {output_dir}")
    return str(output_dir)

def prepare_mendeley_dataset(dataset_path: str):
    """Convert Mendeley binary classification to standardized structure"""
    print(f"[PREP] Preparing Mendeley dataset from {dataset_path}...")
    
    path = Path(dataset_path)
    
    original_dir = path / "database" / "amostra"
    processed_dir = path / "database" / "amostra_processada"
    
    if not original_dir.exists():
        print("[ERROR] Original data not found. Please download and extract first.")
        return None
    
    output_dir = DATASETS_DIR / "cv-standard-binary"
    output_dir.mkdir(parents=True, exist_ok=True)
    
    import shutil
    import random
    
    all_images = []
    for cls in ['normal', 'defective']:
        cls_dir = original_dir / cls
        if cls_dir.exists():
            for img in cls_dir.glob('*'):
                all_images.append((img, cls))
    
    random.seed(42)
    random.shuffle(all_images)
    
    n = len(all_images)
    train_end = int(0.8 * n)
    val_end = int(0.9 * n)
    
    splits = {
        'train': all_images[:train_end],
        'val': all_images[train_end:val_end],
        'test': all_images[val_end:]
    }
    
    for split, items in splits.items():
        for img_path, cls in items:
            dst_dir = output_dir / split / cls
            dst_dir.mkdir(parents=True, exist_ok=True)
            shutil.copy2(img_path, dst_dir / img_path.name)
        print(f"   {split}: {len(items)} images")
    
    import json
    meta = {
        'source': 'mendeley-ceramics-defects-detection',
        'classes': ['normal', 'defective'],
        'format': 'folder_per_class',
        'path': str(output_dir),
        'total_images': n
    }
    with open(output_dir / 'meta.json', 'w') as f:
        json.dump(meta, f, indent=2)
    
    print(f"[OK] Standardized binary dataset at: {output_dir}")
    return str(output_dir)

def create_demo_cv_samples():
    """Create minimal demo images for testing pipeline"""
    print("[DEMO] Creating demo CV samples for pipeline testing...")
    
    from PIL import Image, ImageDraw
    import random
    
    demo_dir = DATASETS_DIR / "demo-samples"
    demo_dir.mkdir(parents=True, exist_ok=True)
    
    for i in range(20):
        img = Image.new('RGB', (512, 512), color=(220, 220, 220))
        draw = ImageDraw.Draw(img)
        
        # Add tile grid pattern
        for x in range(0, 512, 128):
            draw.line([(x, 0), (x, 512)], fill=(200, 200, 200), width=2)
        for y in range(0, 512, 128):
            draw.line([(0, y), (512, y)], fill=(200, 200, 200), width=2)
        
        # Add random crack for defective samples (70%)
        if random.random() < 0.7:
            x1 = random.randint(50, 462)
            y1 = random.randint(50, 462)
            x2 = x1 + random.randint(-100, 100)
            y2 = y1 + random.randint(-100, 100)
            draw.line([(x1, y1), (x2, y2)], fill=(50, 50, 50), width=random.randint(1, 4))
            
            for _ in range(10):
                nx = x1 + random.randint(-20, 20)
                ny = y1 + random.randint(-20, 20)
                draw.point((nx, ny), fill=(80, 80, 80))
        
        label = 'defective' if random.random() < 0.7 else 'normal'
        img.save(demo_dir / f"demo_{i:03d}_{label}.jpg")
    
    print(f"[OK] Created 20 demo samples at: {demo_dir}")
    return str(demo_dir)

def main():
    parser = argparse.ArgumentParser(description='Download CV datasets for tile defect detection')
    parser.add_argument('--roboflow-api-key', type=str, help='Roboflow API key')
    parser.add_argument('--skip-roboflow', action='store_true', help='Skip Roboflow download')
    parser.add_argument('--skip-mendeley', action='store_true', help='Skip Mendeley setup')
    parser.add_argument('--create-demo', action='store_true', default=True, help='Create demo samples')
    
    args = parser.parse_args()
    
    print("="*60)
    print("CV Dataset Downloader for StroyKontrol AI")
    print("="*60)
    
    results = {}
    
    if not args.skip_roboflow and args.roboflow_api_key:
        rf_path = download_roboflow_ceramic(args.roboflow_api_key)
        if rf_path:
            std_path = prepare_roboflow_dataset(rf_path)
            results['roboflow'] = std_path
    elif not args.skip_roboflow:
        print("\n[!] Skipping Roboflow (no API key provided)")
        print("   Get one free at: https://app.roboflow.com")
    
    if not args.skip_mendeley:
        mend_path = download_mendeley_ceramics()
        results['mendeley'] = mend_path
    
    if args.create_demo:
        demo_path = create_demo_cv_samples()
        results['demo'] = demo_path
    
    print("\n" + "="*60)
    print("Download Summary")
    print("="*60)
    for name, path in results.items():
        status = "[OK]" if path else "[FAIL]"
        print(f"{status} {name}: {path}")
    
    return results

if __name__ == '__main__':
    main()
