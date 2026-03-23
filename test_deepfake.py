import asyncio
from bonus.deepfake import scan_url_for_deepfakes, extract_images_from_url

async def test():
    print('PASS: Deepfake module imports correctly')
    images = extract_images_from_url('https://en.wikipedia.org/wiki/Eiffel_Tower')
    print(f'PASS: Found {len(images)} images from test URL')
    deepfakes = await scan_url_for_deepfakes('https://en.wikipedia.org/wiki/Eiffel_Tower')
    print(f'PASS: Deepfake scan result: {len(deepfakes)} items')

if __name__ == "__main__":
    asyncio.run(test())