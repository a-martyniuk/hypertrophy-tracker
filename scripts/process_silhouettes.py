import os
from PIL import Image
import numpy as np

def convert_to_transparent(input_path, output_path):
    print(f"Processing {input_path} -> {output_path}")
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img, dtype=np.float32)
    
    # R, G, B, A channels
    r, g, b, _ = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    
    # Calculate luminance / brightness
    brightness = 0.299 * r + 0.587 * g + 0.114 * b
    
    # Calculate alpha based on brightness and golden hue presence
    # Solid black (< 8) becomes 0 alpha
    # Transition threshold between 8 and 35
    alpha = np.clip((brightness - 5) / 25.0 * 255.0, 0, 255)
    
    # For body fill where brightness is lower but body is present (dark gray inside body):
    # Ensure inner body isn't overly transparent if it has color
    body_mask = (r > 12) | (g > 10) | (b > 8)
    alpha = np.where(body_mask & (alpha < 120), np.clip(brightness * 4.0, 60, 255), alpha)
    
    data[:, :, 3] = alpha
    
    result = Image.fromarray(data.astype(np.uint8), mode="RGBA")
    
    # Find bounding box of non-transparent pixels to center cleanly
    bbox = result.getbbox()
    if bbox:
        # Add 2% padding
        w, h = result.size
        # Keep aspect ratio and center on a 600x1200 high-res canvas
        cropped = result.crop(bbox)
        target = Image.new("RGBA", (cropped.width + 40, cropped.height + 40), (0, 0, 0, 0))
        target.paste(cropped, (20, 20), cropped)
        target.save(output_path, "PNG", optimize=True)
    else:
        result.save(output_path, "PNG", optimize=True)
    print(f"Saved: {output_path}")

male_src = r"C:\Users\Martyniuk-Ntbk-Gmr\.gemini\antigravity\brain\bd2d45a8-05c5-42a9-86f5-9bac23324394\exact_hud_silhouette_1787510941566.jpg"
female_src = r"C:\Users\Martyniuk-Ntbk-Gmr\.gemini\antigravity\brain\bd2d45a8-05c5-42a9-86f5-9bac23324394\exact_female_silhouette_1787510975042.jpg"

out_male = r"D:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png"
out_female = r"D:\Projects\hypertrophy-tracker\src\assets\silhouette_female.png"

convert_to_transparent(male_src, out_male)
convert_to_transparent(female_src, out_female)
print("Conversion completed successfully!")
