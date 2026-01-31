import cv2
import numpy as np
import os

def image_to_svg_paths(image_path, sex='male'):
    # Load image
    img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if img is None:
        print(f"Error: Could not load {image_path}")
        return

    # Extract Alpha channel as mask
    if img.shape[2] == 4:
        alpha = img[:, :, 3]
        _, body_mask = cv2.threshold(alpha, 10, 255, cv2.THRESH_BINARY)
    else:
        # Fallback if no alpha, assume white background or similar
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, body_mask = cv2.threshold(gray, 240, 255, cv2.THRESH_BINARY_INV)

    h, w = body_mask.shape
    
    # Define Cutting Zones (Rectangles [x1, y1, x2, y2]) based on 200x600 canvas
    # The image might be different resolution, we will scale normalized zones
    
    # Normalized coordinates (0-1) based on visual estimation of standard silhouette
    # Male/Female differences in proportions handled by separate configs if needed, 
    # but for simplicity we'll use generous boxes that rely on the body_mask to do the shaping.
    
    zones = {}
    
    if sex == 'male':
        # Male Zones
        zones = {
            'neck': [0.35, 0.12, 0.65, 0.18],
            'pecho': [0.25, 0.18, 0.75, 0.28],
            'waist': [0.30, 0.28, 0.70, 0.38], # Abs area
            'hips':  [0.25, 0.38, 0.75, 0.45],
            
            # Left side (Viewer's Left = Right Arm of person if facing front? Usually Front View)
            # Assuming Standard Anatomical Position (Palms forward)
            # Left on screen = Right side of body
            'arm-right':     [0.05, 0.20, 0.25, 0.32], # Upper Arm
            'forearm-right': [0.02, 0.32, 0.22, 0.42], 
            'thigh-right':   [0.15, 0.45, 0.48, 0.65],
            'calf-right':    [0.12, 0.65, 0.48, 0.85],
            
            # Right on screen = Left side of body
            'arm-left':      [0.75, 0.20, 0.95, 0.32],
            'forearm-left':  [0.78, 0.32, 0.98, 0.42],
            'thigh-left':    [0.52, 0.45, 0.85, 0.65],
            'calf-left':     [0.52, 0.65, 0.88, 0.85],
        }
    else:
        # Female Zones (Adjusted roughly)
        zones = {
            'neck': [0.38, 0.13, 0.62, 0.18],
            'pecho': [0.28, 0.18, 0.72, 0.29],
            'waist': [0.32, 0.29, 0.68, 0.38],
            'hips':  [0.25, 0.38, 0.75, 0.48], # Wider hips
            
            'arm-right':     [0.08, 0.22, 0.28, 0.33],
            'forearm-right': [0.05, 0.33, 0.25, 0.43],
            'thigh-right':   [0.15, 0.48, 0.48, 0.68],
            'calf-right':    [0.18, 0.68, 0.48, 0.88],
            
            'arm-left':      [0.72, 0.22, 0.92, 0.33],
            'forearm-left':  [0.75, 0.33, 0.95, 0.43],
            'thigh-left':    [0.52, 0.48, 0.85, 0.68],
            'calf-left':     [0.52, 0.68, 0.82, 0.88],
        }

    svg_paths = {}

    for name, coords in zones.items():
        x1, y1, x2, y2 = coords
        x1, x2 = int(x1 * w), int(x2 * w)
        y1, y2 = int(y1 * h), int(y2 * h)
        
        # Create Box Mask
        box_mask = np.zeros_like(body_mask)
        cv2.rectangle(box_mask, (x1, y1), (x2, y2), 255, -1)
        
        # Intersect
        part_mask = cv2.bitwise_and(body_mask, box_mask)
        
        # Find Contours
        contours, _ = cv2.findContours(part_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            continue
            
        # Get largest contour (ignore noise)
        cnt = max(contours, key=cv2.contourArea)
        
        # Simplify contour
        epsilon = 0.002 * cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, epsilon, True)
        
        # Convert to SVG Path String
        # M x y L x y ... Z
        # We need to scale points back to 200x600 coordinating system if image is different
        # Let's assume we map image pixels directly to 200x600 for simplicity or calculate scale
        
        path_str = "M"
        for pt in approx:
            px, py = pt[0]
            # Map px, py to 200x550 target viewbox
            # Canvas in VolumeHeatmap is 200x600, image drawn 200x550
            # So scale factor is: target_x / img_w
            
            sx = (px / w) * 200
            sy = (py / h) * 550
            
            path_str += f" {sx:.1f},{sy:.1f}"
        path_str += " Z"
        
        svg_paths[name] = path_str

    return svg_paths

with open('paths_utf8.txt', 'w', encoding='utf-8') as f:
    f.write("--- MALE PATHS ---\n")
    male_paths = image_to_svg_paths(r"D:\Projects\hypertrophy-tracker\src\assets\silhouette_volume_male.png", 'male')
    for k, v in male_paths.items():
        f.write(f"{k}: \"{v}\",\n")

    f.write("\n--- FEMALE PATHS ---\n")
    female_paths = image_to_svg_paths(r"D:\Projects\hypertrophy-tracker\src\assets\silhouette_volume_female.png", 'female')
    for k, v in female_paths.items():
        f.write(f"{k}: \"{v}\",\n")

print("Done writing to paths_utf8.txt")
