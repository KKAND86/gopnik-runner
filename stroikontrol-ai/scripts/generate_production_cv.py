"""
Generate production-quality synthetic tile defect dataset
Creates photorealistic tile images with various defects
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
import random
from pathlib import Path

def generate_tile_base(size=512):
    """Generate realistic ceramic tile base texture"""
    img = Image.new('RGB', (size, size), color=(235, 235, 235))
    draw = ImageDraw.Draw(img)
    
    # Subtle texture variation
    pixels = img.load()
    for i in range(size):
        for j in range(size):
            noise = random.randint(-8, 8)
            r = max(0, min(255, 235 + noise))
            g = max(0, min(255, 233 + noise))
            b = max(0, min(255, 230 + noise))
            pixels[i, j] = (r, g, b)
    
    return img

def add_grout_lines(img, tile_size=128):
    """Add realistic grout lines between tiles"""
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    # Grout color (slightly darker grey)
    grout_color = (195, 195, 195)
    
    # Horizontal lines
    for y in range(0, height, tile_size):
        draw.line([(0, y), (width, y)], fill=grout_color, width=3)
    
    # Vertical lines
    for x in range(0, width, tile_size):
        draw.line([(x, 0), (x, height)], fill=grout_color, width=3)
    
    return img

def add_glaze_effect(img):
    """Add subtle glaze shine effect"""
    # Slight blur for glazed look
    img = img.filter(ImageFilter.GaussianBlur(radius=0.3))
    
    # Enhance contrast slightly
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.05)
    
    return img

def add_crack(img, severity='medium'):
    """Add realistic crack to tile"""
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    # Random starting point
    start_x = random.randint(50, width - 50)
    start_y = random.randint(50, height - 50)
    
    # Crack path with jitter
    points = [(start_x, start_y)]
    
    # Crack length
    if severity == 'light':
        length = random.randint(30, 80)
        width_crack = 1
    elif severity == 'medium':
        length = random.randint(80, 150)
        width_crack = random.randint(1, 2)
    else:  # severe
        length = random.randint(150, 250)
        width_crack = random.randint(2, 4)
    
    # Direction
    angle = random.uniform(0, 2 * np.pi)
    
    for i in range(length // 5):
        dx = int(5 * np.cos(angle) + random.randint(-3, 3))
        dy = int(5 * np.sin(angle) + random.randint(-3, 3))
        
        # Random direction change
        angle += random.uniform(-0.3, 0.3)
        
        new_x = max(10, min(width - 10, points[-1][0] + dx))
        new_y = max(10, min(height - 10, points[-1][1] + dy))
        points.append((new_x, new_y))
    
    # Draw main crack
    for i in range(len(points) - 1):
        draw.line([points[i], points[i+1]], fill=(60, 60, 60), width=width_crack)
    
    # Add secondary micro-cracks
    if severity in ['medium', 'severe']:
        for _ in range(random.randint(2, 5)):
            idx = random.randint(0, len(points) - 1)
            branch_start = points[idx]
            branch_angle = angle + random.uniform(-1.0, 1.0)
            branch_len = random.randint(10, 40)
            
            branch_end = (
                int(branch_start[0] + branch_len * np.cos(branch_angle)),
                int(branch_start[1] + branch_len * np.sin(branch_angle))
            )
            draw.line([branch_start, branch_end], fill=(80, 80, 80), width=1)
    
    # Add edge chips along crack
    if severity == 'severe':
        for point in points[::3]:
            offset = random.randint(-8, 8)
            chip_x = point[0] + offset
            chip_y = point[1] + offset
            size_chip = random.randint(2, 5)
            draw.ellipse(
                [chip_x - size_chip, chip_y - size_chip, 
                 chip_x + size_chip, chip_y + size_chip],
                fill=(120, 120, 120)
            )
    
    return img

def add_chipping(img, count=3):
    """Add edge chipping defects"""
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    for _ in range(count):
        # Random position near edge
        edge = random.choice(['top', 'bottom', 'left', 'right'])
        
        if edge == 'top':
            x = random.randint(20, width - 20)
            y = random.randint(0, 20)
        elif edge == 'bottom':
            x = random.randint(20, width - 20)
            y = random.randint(height - 20, height)
        elif edge == 'left':
            x = random.randint(0, 20)
            y = random.randint(20, height - 20)
        else:  # right
            x = random.randint(width - 20, width)
            y = random.randint(20, height - 20)
        
        # Draw chip
        size = random.randint(5, 15)
        draw.polygon([
            (x, y),
            (x + size, y + random.randint(-size//2, size//2)),
            (x + random.randint(-size//2, size//2), y + size)
        ], fill=(140, 140, 140))
    
    return img

def add_stain(img):
    """Add discoloration stain"""
    draw = ImageDraw.Draw(img)
    width, height = img.size
    
    # Random stain position
    cx = random.randint(100, width - 100)
    cy = random.randint(100, height - 100)
    
    # Irregular stain shape
    for r in range(random.randint(20, 50), 0, -2):
        opacity = int(255 * (1 - r / 50) * 0.3)
        color = (200, 180, 160, opacity)
        
        offset_x = random.randint(-10, 10)
        offset_y = random.randint(-10, 10)
        
        draw.ellipse(
            [cx + offset_x - r, cy + offset_y - r,
             cx + offset_x + r, cy + offset_y + r],
            fill=color[:3]
        )
    
    return img

def generate_defective_tile(size=512):
    """Generate tile with realistic defects"""
    img = generate_tile_base(size)
    img = add_grout_lines(img)
    
    # Add one or more defects
    defect_types = random.choices(
        ['crack', 'chipping', 'stain', 'combo'],
        weights=[40, 25, 15, 20],
        k=1
    )[0]
    
    if defect_types == 'crack':
        severity = random.choice(['light', 'medium', 'severe'])
        img = add_crack(img, severity)
    elif defect_types == 'chipping':
        img = add_chipping(img, count=random.randint(2, 5))
    elif defect_types == 'stain':
        img = add_stain(img)
    else:  # combo
        if random.random() < 0.7:
            img = add_crack(img, 'medium')
        if random.random() < 0.5:
            img = add_chipping(img, count=random.randint(1, 3))
        if random.random() < 0.3:
            img = add_stain(img)
    
    img = add_glaze_effect(img)
    
    return img

def generate_normal_tile(size=512):
    """Generate clean tile without defects"""
    img = generate_tile_base(size)
    img = add_grout_lines(img)
    img = add_glaze_effect(img)
    
    # Maybe add very subtle variation that looks like normal tile texture
    if random.random() < 0.3:
        # Slight color variation (normal manufacturing difference)
        pixels = img.load()
        for i in range(0, size, 2):
            for j in range(0, size, 2):
                r, g, b = pixels[i, j]
                variation = random.randint(-3, 3)
                pixels[i, j] = (
                    max(0, min(255, r + variation)),
                    max(0, min(255, g + variation)),
                    max(0, min(255, b + variation))
                )
    
    return img

def create_production_dataset(output_dir, n_normal=200, n_defective=200):
    """Create production-quality dataset"""
    output_dir = Path(output_dir)
    normal_dir = output_dir / 'normal'
    defective_dir = output_dir / 'defective'
    
    normal_dir.mkdir(parents=True, exist_ok=True)
    defective_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"[PROD] Generating {n_normal} normal + {n_defective} defective tiles...")
    
    # Generate normal tiles
    for i in range(n_normal):
        img = generate_normal_tile()
        img.save(normal_dir / f"normal_{i:04d}.jpg", quality=95)
    
    # Generate defective tiles
    for i in range(n_defective):
        img = generate_defective_tile()
        img.save(defective_dir / f"defective_{i:04d}.jpg", quality=95)
    
    print(f"[OK] Dataset created: {output_dir}")
    print(f"   Normal: {n_normal} images")
    print(f"   Defective: {n_defective} images")
    print(f"   Total: {n_normal + n_defective} images")
    
    return output_dir

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', default='datasets/cv/real-photos')
    parser.add_argument('--normal', type=int, default=200)
    parser.add_argument('--defective', type=int, default=200)
    args = parser.parse_args()
    
    create_production_dataset(args.output, args.normal, args.defective)
