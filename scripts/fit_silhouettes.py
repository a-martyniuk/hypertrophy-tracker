import os
from PIL import Image
import numpy as np

def process_and_fit_silhouette(input_path, output_path, target_w=200, target_h=550):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    
    r, g, b, _ = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    brightness = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Transparency mask
    alpha = np.clip((brightness - 5) / 18.0 * 255.0, 0, 255)
    body_mask = (r > 12) | (g > 10) | (b > 8)
    alpha = np.where(body_mask & (alpha < 140), np.clip(brightness * 4.0, 80, 255), alpha)
    data[:, :, 3] = alpha
    
    result = Image.fromarray(data.astype(np.uint8), mode="RGBA")
    
    # Get tight bounding box of the body
    bbox = result.getbbox() # (left, top, right, bottom)
    print(f"Original bbox: {bbox}")
    
    cropped = result.crop(bbox)
    
    # We want the body to fill the 200x550 canvas prominently:
    # Width: 188px (paste_x: 6)
    # Height: 515px (paste_y: 20)
    body_w = 188
    body_h = 515
    
    resized = cropped.resize((body_w, body_h), Image.Resampling.LANCZOS)
    
    # Canvas size: 200 x 550
    canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
    paste_x = (target_w - body_w) // 2
    paste_y = 20
    canvas.paste(resized, (paste_x, paste_y), resized)
    
    canvas.save(output_path, "PNG", optimize=True)
    print(f"Saved fitted silhouette: {output_path} (width: {target_w}, height: {target_h}, paste_x: {paste_x}, paste_y: {paste_y})")

male_src = r"C:\Users\Martyniuk-Ntbk-Gmr\.gemini\antigravity\brain\bd2d45a8-05c5-42a9-86f5-9bac23324394\exact_hud_silhouette_1787510941566.jpg"
female_src = r"C:\Users\Martyniuk-Ntbk-Gmr\.gemini\antigravity\brain\bd2d45a8-05c5-42a9-86f5-9bac23324394\exact_female_silhouette_1787510975042.jpg"

out_male = r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png"
out_female = r"D:\Projects\hypertrophy-tracker\src\assets\silhouette_female.png"

process_and_fit_silhouette(male_src, out_male)
process_and_fit_silhouette(female_src, out_female)
