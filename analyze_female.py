from PIL import Image
import numpy as np

def find_orange_dots(image_path):
    img = Image.open(image_path).convert('RGB')
    data = np.array(img)
    
    # Target color #f59e0b -> (245, 158, 11)
    target = np.array([245, 158, 11])
    
    # Tolerant match
    diff = np.abs(data - target)
    mask = np.all(diff < 50, axis=-1)
    
    # Find clusters
    coords = np.column_stack(np.where(mask))
    if len(coords) == 0:
        return []

    dots = []
    while len(coords) > 0:
        center = coords[0]
        # Points within 15px of this center
        dist = np.linalg.norm(coords - center, axis=1)
        cluster = coords[dist < 15]
        dots.append(np.mean(cluster, axis=0))
        coords = coords[dist >= 15]
    
    # Sort by Y then X
    return sorted(dots, key=lambda x: (x[0], x[1]))

if __name__ == "__main__":
    path = "src/assets/silhouette_female.png"
    dots = find_orange_dots(path)
    print(f"I found {len(dots)} dots.")
    
    # Get image dimensions to scale to 200 units (based on width)
    img = Image.open(path)
    w, h = img.size
    scale = 200 / w
    
    for i, (y, x) in enumerate(dots):
        # We want to output SVG-ready coordinates (scaled)
        # Assuming SVG width is 200
        svg_x = x * scale
        svg_y = y * scale
        print(f"Dot {i}: x={svg_x:.1f}, y={svg_y:.1f}")
