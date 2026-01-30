from PIL import Image
import numpy as np

def find_orange_dots(image_path):
    img = Image.open(image_path).convert('RGB')
    data = np.array(img)
    
    # Target color #f59e0b -> (245, 158, 11)
    target = np.array([245, 158, 11])
    
    # Tolerant match
    diff = np.abs(data - target)
    mask = np.all(diff < 40, axis=-1)
    
    # Find clusters (very basic)
    coords = np.column_stack(np.where(mask))
    if len(coords) == 0:
        return []
        
    # Group neighboring points into dots
    dots = []
    visited = set()
    for r, c in coords:
        if (r, c) in visited: continue
        # Start a new cluster
        cluster = []
        q = [(r, c)]
        visited.add((r, c))
        while q:
            curr_r, curr_c = q.pop(0)
            cluster.append((curr_r, curr_c))
            for dr in [-1, 0, 1]:
                for dc in [-1, 0, 1]:
                    nr, nc = curr_r + dr, curr_c + dc
                    if 0 <= nr < data.shape[0] and 0 <= nc < data.shape[1] and \
                       mask[nr, nc] and (nr, nc) not in visited:
                        visited.add((nr, nc))
                        q.append((nr, nc))
        center_r = sum(p[0] for p in cluster) / len(cluster)
        center_c = sum(p[1] for p in cluster) / len(cluster)
        dots.append((center_c, center_r))
        
    return sorted(dots, key=lambda x: x[1])

dots = find_orange_dots(r'd:\Projects\hypertrophy-tracker\src\assets\clean_red_silhouette.png')
print(f"I found {len(dots)} dots.")
for i, (x, y) in enumerate(dots):
    print(f"Dot {i}: x={x:.1f}, y={y:.1f}")
