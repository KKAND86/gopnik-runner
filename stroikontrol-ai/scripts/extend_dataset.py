"""
Create augmented production dataset from synthetic base images
Uses Albumentations library for realistic augmentations
"""
import os
import random
from pathlib import Path
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

try:
    import albumentations as A
    from albumentations.pytorch import ToTensorV2
    ALBU_AVAILABLE = True
except ImportError:
    ALBU_AVAILABLE = False

def create_augmentation_pipeline():
    """Create realistic augmentation pipeline for tile images"""
    if ALBU_AVAILABLE:
        return A.Compose([
            A.OneOf([
                A.RandomBrightnessContrast(brightness_limit=0.2, contrast_limit=0.2, p=1),
                A.RandomGamma(gamma_limit=(80, 120), p=1),
                A.HueSaturationValue(hue_shift_limit=10, sat_shift_limit=20, val_shift_limit=20, p=1),
            ], p=0.8),
            
            A.OneOf([
                A.GaussNoise(var_limit=(10, 50), p=1),
                A.ISONoise(intensity=(0.1, 0.3), color_shift=(0.01, 0.05), p=1),
            ], p=0.5),
            
            A.OneOf([
                A.MotionBlur(blur_limit=3, p=1),
                A.MedianBlur(blur_limit=3, p=1),
                A.GaussianBlur(blur_limit=3, p=1),
            ], p=0.3),
            
            A.OneOf([
                A.RandomShadow(shadow_roi=(0, 0.5, 1, 1), num_shadows_lower=1, num_shadows_upper=2, p=1),
                A.RandomSunFlare(flare_roi=(0, 0, 1, 0.5), angle_lower=0.5, p=0.3),
            ], p=0.3),
            
            A.ShiftScaleRotate(shift_limit=0.05, scale_limit=0.1, rotate_limit=5, p=0.5),
            A.RandomResizedCrop(height=512, width=512, scale=(0.8, 1.0), p=0.3),
            
            A.OneOf([
                A.CLAHE(clip_limit=4, p=1),
                A.Sharpen(alpha=(0.2, 0.5), lightness=(0.5, 1.0), p=1),
                A.Emboss(alpha=(0.2, 0.5), strength=(0.5, 1.0), p=1),
            ], p=0.3),
        ])
    else:
        return None

def augment_with_pil(image_path, output_path, augment_type='standard'):
    """Augment image using PIL (fallback when albumentations not available)"""
    img = Image.open(image_path)
    
    if augment_type == 'brightness':
        factor = random.uniform(0.7, 1.3)
        img = ImageEnhance.Brightness(img).enhance(factor)
    
    elif augment_type == 'contrast':
        factor = random.uniform(0.7, 1.3)
        img = ImageEnhance.Contrast(img).enhance(factor)
    
    elif augment_type == 'sharpness':
        factor = random.uniform(0.5, 2.0)
        img = ImageEnhance.Sharpness(img).enhance(factor)
    
    elif augment_type == 'blur':
        radius = random.uniform(0.5, 2.0)
        img = img.filter(ImageFilter.GaussianBlur(radius=radius))
    
    elif augment_type == 'noise':
        img_array = np.array(img)
        noise = np.random.normal(0, random.randint(5, 15), img_array.shape).astype(np.uint8)
        img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)
        img = Image.fromarray(img_array)
    
    elif augment_type == 'rotation':
        angle = random.uniform(-5, 5)
        img = img.rotate(angle, fillcolor=(235, 235, 235))
    
    elif augment_type == 'crop':
        w, h = img.size
        left = random.randint(0, w // 10)
        top = random.randint(0, h // 10)
        right = w - random.randint(0, w // 10)
        bottom = h - random.randint(0, h // 10)
        img = img.crop((left, top, right, bottom))
        img = img.resize((512, 512))
    
    elif augment_type == 'perspective':
        # Simple perspective simulation
        w, h = img.size
        img = img.transform((w, h), Image.Transform.QUAD,
                          (0, random.randint(0, 20), 
                           w, random.randint(0, 20),
                           w, h - random.randint(0, 20),
                           0, h - random.randint(0, 20)))
    
    img.save(output_path, quality=95)
    return output_path

def create_extended_dataset(input_dir, output_dir, target_total=2000):
    """Create extended dataset with augmentations"""
    input_dir = Path(input_dir)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Create class directories
    normal_dir = output_dir / 'normal'
    defective_dir = output_dir / 'defective'
    normal_dir.mkdir(exist_ok=True)
    defective_dir.mkdir(exist_ok=True)
    
    # Collect base images (check subdirectories or flat structure)
    normal_subdir = input_dir / 'normal'
    defective_subdir = input_dir / 'defective'
    
    if normal_subdir.exists() and defective_subdir.exists():
        base_images = {
            'normal': list(normal_subdir.glob('*.jpg')),
            'defective': list(defective_subdir.glob('*.jpg'))
        }
    else:
        base_images = {
            'normal': list(input_dir.glob('normal_*.jpg')),
            'defective': list(input_dir.glob('defective_*.jpg'))
        }
    
    print(f"[EXTEND] Base images: {len(base_images['normal'])} normal, {len(base_images['defective'])} defective")
    
    # Augmentation types
    aug_types = ['brightness', 'contrast', 'sharpness', 'blur', 'noise', 'rotation', 'crop', 'perspective']
    
    for class_name, images in base_images.items():
        target_class_dir = normal_dir if class_name == 'normal' else defective_dir
        
        # Copy originals
        for i, img_path in enumerate(images):
            import shutil
            shutil.copy2(img_path, target_class_dir / f"{class_name}_orig_{i:04d}.jpg")
        
        # Calculate how many augmentations per image
        n_augs_per_image = max(1, (target_total // 2 - len(images)) // len(images))
        
        print(f"[EXTEND] Generating {n_augs_per_image} augmentations per {class_name} image...")
        
        aug_count = 0
        for img_path in images:
            for aug_idx in range(n_augs_per_image):
                aug_type = random.choice(aug_types)
                output_path = target_class_dir / f"{class_name}_aug{aug_idx}_{img_path.stem}.jpg"
                augment_with_pil(img_path, output_path, aug_type)
                aug_count += 1
        
        print(f"   Created {len(images)} original + {aug_count} augmented = {len(images) + aug_count} total")
    
    # Count final
    normal_count = len(list(normal_dir.glob('*.jpg')))
    defective_count = len(list(defective_dir.glob('*.jpg')))
    total = normal_count + defective_count
    
    print(f"\n[OK] Extended dataset created: {output_dir}")
    print(f"   Normal: {normal_count}")
    print(f"   Defective: {defective_count}")
    print(f"   Total: {total}")
    
    return output_dir

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', default='datasets/cv/real-photos')
    parser.add_argument('--output', default='datasets/cv/extended-photos')
    parser.add_argument('--total', type=int, default=2000)
    args = parser.parse_args()
    
    create_extended_dataset(args.input, args.output, args.total)
