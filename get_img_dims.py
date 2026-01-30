from PIL import Image
import os

img_path = r'd:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png'
if os.path.exists(img_path):
    with Image.open(img_path) as img:
        print(f"Dimensions: {img.width}x{img.height}")
else:
    print("File not found.")
