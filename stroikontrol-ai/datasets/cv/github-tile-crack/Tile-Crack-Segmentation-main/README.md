# Tile-Crack-Segmentation
In this project, we have developed a computer vision algorithm to detect cracks on the surface of tiles. Tile production can sometimes result in defects, such as the creation of cracks, and our goal is to identify these defects efficiently.

## <img width="25" height="25" src="https://img.icons8.com/dotty/80/41b883/overview-pages-2.png" alt="overview-pages-2"/> Overview
Tiles often have intricate designs or patterns on their surfaces. These designs can sometimes make it challenging to distinguish between genuine cracks and the design elements. To improve the accuracy of crack detection, we leverage the tile's design as a reference point.

### Problem Statement
The primary challenge is to detect cracks accurately, even when they coexist with the tile's decorative lines. This project addresses the problem of crack detection in images of tiles.

### Approach
To implement this project, we follow these main steps:
1. **Image Matching**: We start by matching the image of the tile's design with the image of the manufactured tile. This process involves identifying key points in both images to establish correspondence. This step helps align the design with the actual tile, even if there are slight variations in angle or scale.
2. **Training a Model**: Once we have the matched data, we use it to train a machine learning model. This model is trained to identify areas on the tile where cracks are present. It leverages the information obtained during the image matching step to improve the accuracy of crack detection.

## <img width="20" height="20" src="https://img.icons8.com/ios/50/41b883/database-options.png" alt="database-options"/> Data 
Our dataset includes images of tiles, some of which have cracks, while others do not. The dataset serves as the foundation for training our crack detection model. You can find the dataset by clicking [HERE](https://drive.google.com/file/d/1ixS6ump2gFwwChlg4vrGyVa_9t0csLKd/view?usp=share_link).
