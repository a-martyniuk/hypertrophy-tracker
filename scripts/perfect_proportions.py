import os
from PIL import Image
import numpy as np

def create_perfect_proportions_silhouette(input_path, output_path, canvas_w=260, canvas_h=550, threshold=15):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    
    r, g, b, _ = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    brightness = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Transparency mask
    alpha = np.clip((brightness - 5) / 16.0 * 255.0, 0, 255)
    body_mask = (r > 14) | (g > 12) | (b > 10)
    alpha = np.where(body_mask & (alpha < 140), np.clip(brightness * 4.0, 80, 255), alpha)
    data[:, :, 3] = alpha
    
    # Find bounding box based on brightness > threshold
    mask = brightness > threshold
    y_indices, x_indices = np.where(mask)
    if len(y_indices) == 0:
        top, bottom, left, right = 0, img.height, 0, img.width
    else:
        top, bottom = np.min(y_indices), np.max(y_indices)
        left, right = np.min(x_indices), np.max(x_indices)
    
    print(f"File: {os.path.basename(input_path)}, detected body bbox: left={left}, top={top}, right={right}, bottom={bottom}")
    
    result = Image.fromarray(data.astype(np.uint8), mode="RGBA")
    cropped = result.crop((left, top, right, bottom))
    
    target_h = 515
    aspect = cropped.width / cropped.height
    target_w = int(target_h * aspect)
    
    resized = cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    paste_x = (canvas_w - target_w) // 2
    paste_y = 15
    canvas.paste(resized, (paste_x, paste_y), resized)
    
    canvas.save(output_path, "PNG", optimize=True)
    print(f"Saved: {output_path} (canvas: {canvas_w}x{canvas_h}, body: {target_w}x{target_h}, paste_x: {paste_x}, paste_y: {paste_y})")

male_src = r"C:\Users\Martyniuk-Ntbk-Gmr\.gemini\antigravity\brain\bd2d45a8-05c5-42a9-86f5-9bac23324394\exact_hud_silhouette_1787510941566.jpg"
female_src = r"C:\Users\Martyniuk-Ntbk-Gmr\.gemini\antigravity\brain\bd2d45a8-05c5-42a9-86f5-9bac23324394\exact_female_silhouette_1787510975042.jpg"

out_male = r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png"
out_female = r"D:\Projects\hypertrophy-tracker\src\assets\silhouette_female.png"

create_perfect_proportions_silhouette(male_src, out_male, threshold=12)
create_perfect_proportions_silhouette(female_src, out_female, threshold=20)
