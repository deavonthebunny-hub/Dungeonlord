from pathlib import Path
import sys

import pypdfium2 as pdfium


source = Path(sys.argv[1]).resolve()
output_dir = Path(sys.argv[2]).resolve()
output_dir.mkdir(parents=True, exist_ok=True)
for previous_page in output_dir.glob("page-*.png"):
    previous_page.unlink()

document = pdfium.PdfDocument(source)
scale = 130 / 72

for page_number in range(len(document)):
    page = document[page_number]
    bitmap = page.render(scale=scale)
    image = bitmap.to_pil()
    image.save(output_dir / f"page-{page_number + 1:02d}.png")

print(f"Rendered {len(document)} pages to {output_dir}")
