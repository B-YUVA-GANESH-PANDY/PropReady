import os
import re
import fitz  # PyMuPDF
import unicodedata
from PIL import Image
from typing import List, Dict, Any, Tuple

# Comprehensive regex to catch corrupted font mappings, unprintable symbols, private use Unicode, and non-printable blocks
GARBAGE_REGEX = re.compile(
    r'[\u0750-\u077F\u07C0-\u07FF\u0800-\u085F\u1F00-\u1FFF\uE000-\uF8FF\uFFF0-\uFFFF\uFFFD]'
)

# Common corrupted sequence patterns (e.g. repeated font mapping glitches like (cid:xxx), garbled accents, or non-Latin/non-Indian blocks)
CID_PATTERN = re.compile(r'\(cid:\d+\)')

def normalize_unicode(text: str) -> str:
    """
    Applies NFC Unicode normalization and strips null bytes, non-printable control characters,
    and corrupted replacement characters.
    """
    if not text:
        return ""
    # NFC Normalization
    normalized = unicodedata.normalize('NFC', text)
    # Strip replacement char \uFFFD and non-printable control characters
    clean_chars = []
    for ch in normalized:
        if ch in ('\n', '\r', '\t') or (ord(ch) >= 32 and ord(ch) != 127 and ord(ch) != 0xFFFD):
            clean_chars.append(ch)
    result = "".join(clean_chars)
    # Collapse multiple blank lines
    return re.sub(r'\n{3,}', '\n\n', result).strip()

def is_text_corrupted(text: str) -> bool:
    """
    Validates whether extracted PDF text is corrupted, font-encoded garbage, or unreadable symbols.
    """
    if not text or len(text.strip()) < 15:
        return True

    text = text.strip()
    total_len = len(text)

    # 1. Check for CID font encoding errors (e.g. (cid:100)(cid:101))
    cid_matches = len(CID_PATTERN.findall(text))
    if cid_matches > 2:
        return True

    # 2. Count explicitly corrupted Unicode characters (NKO, Greek extended, Private Use, Replacement Chars)
    garbage_matches = len(GARBAGE_REGEX.findall(text))
    if garbage_matches / max(1, total_len) > 0.03:
        return True

    # 3. Count valid script characters (ASCII, Devanagari, Tamil, Kannada, Telugu, Malayalam, Bengali, Gujarati, Punjabi, Odia, Urdu)
    valid_script_chars = 0
    for ch in text:
        code = ord(ch)
        if (
            (32 <= code <= 126) or                     # ASCII Printable
            (0x0900 <= code <= 0x097F) or              # Devanagari (Hindi/Marathi)
            (0x0B80 <= code <= 0x0BFF) or              # Tamil
            (0x0C80 <= code <= 0x0CFF) or              # Kannada
            (0x0C00 <= code <= 0x0C7F) or              # Telugu
            (0x0D00 <= code <= 0x0D7F) or              # Malayalam
            (0x0980 <= code <= 0x09FF) or              # Bengali
            (0x0A80 <= code <= 0x0AFF) or              # Gujarati
            (0x0A00 <= code <= 0x0A7F) or              # Punjabi
            (0x0B00 <= code <= 0x0B7F) or              # Odia
            (0x0600 <= code <= 0x06FF) or              # Arabic/Urdu
            ch in ('\n', '\r', '\t', ' ', ',', '.', '-', '/', ':', '(', ')', '#')
        ):
            valid_script_chars += 1

    valid_ratio = valid_script_chars / total_len
    if valid_ratio < 0.60:
        return True

    # 4. Check ratio of alphanumeric letters/numbers
    alpha_num_count = sum(1 for ch in text if ch.isalnum())
    if alpha_num_count / max(1, total_len) < 0.18:
        return True

    return False

def detect_script(text: str) -> str:
    """
    Detects predominant script present in page text to guide multilingual OCR.
    """
    counts = {
        'ta': sum(1 for ch in text if 0x0B80 <= ord(ch) <= 0x0BFF),
        'hi': sum(1 for ch in text if 0x0900 <= ord(ch) <= 0x097F),
        'kn': sum(1 for ch in text if 0x0C80 <= ord(ch) <= 0x0CFF),
        'te': sum(1 for ch in text if 0x0C00 <= ord(ch) <= 0x0C7F),
        'ml': sum(1 for ch in text if 0x0D00 <= ord(ch) <= 0x0D7F),
        'en': sum(1 for ch in text if 65 <= ord(ch) <= 122)
    }
    sorted_scripts = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    if sorted_scripts[0][1] > 10:
        return sorted_scripts[0][0]
    return 'en'

class OCRService:
    def __init__(self):
        self._paddle_instances: Dict[str, Any] = {}
        self._paddle_failed = False

    def _get_paddle_ocr(self, lang: str = 'en'):
        if self._paddle_failed:
            return None
        if lang not in self._paddle_instances:
            try:
                from paddleocr import PaddleOCR
                ocr_inst = PaddleOCR(use_angle_cls=True, lang=lang, show_log=False)
                self._paddle_instances[lang] = ocr_inst
            except Exception as e:
                print(f"PaddleOCR init for lang '{lang}' info/error: {e}")
                if 'en' not in self._paddle_instances and lang != 'en':
                    try:
                        from paddleocr import PaddleOCR
                        self._paddle_instances['en'] = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
                    except Exception:
                        self._paddle_failed = True
                        return None
                return self._paddle_instances.get('en')
        return self._paddle_instances.get(lang)

    def process_document(self, file_path: str, mime_type: str) -> Tuple[int, List[Dict[str, Any]]]:
        """
        Processes PDF or Image using strict OCR Quality Validation:
        1. Extract native PDF text & check quality.
        2. If corrupted or font-encoded garbage, render high-DPI (300 DPI) image & run OCR.
        3. Normalize Unicode and sanitize output to guarantee clean readable text.
        """
        pages_data = []

        if mime_type == "application/pdf" or file_path.lower().endswith(".pdf"):
            doc = fitz.open(file_path)
            page_count = len(doc)

            for page_idx in range(page_count):
                page = doc[page_idx]
                page_num = page_idx + 1

                # Step 1: Extract native selectable PDF text
                fitz_raw_text = page.get_text("text") or ""
                normalized_text = normalize_unicode(fitz_raw_text).strip()

                fitz_words = page.get_text("words") or []
                blocks = []
                for w in fitz_words:
                    clean_word = normalize_unicode(w[4]).strip()
                    if clean_word and not is_text_corrupted(clean_word):
                        blocks.append({
                            "text": clean_word,
                            "bounding_box": [round(w[0], 2), round(w[1], 2), round(w[2] - w[0], 2), round(w[3] - w[1], 2)],
                            "confidence": 0.98
                        })

                # Step 2: Quality Validation — Check if native PDF text is corrupted/garbage
                text_corrupted = is_text_corrupted(normalized_text)

                if text_corrupted:
                    # Native PDF text is corrupted or empty! Render page image at 300 DPI for clean OCR
                    pix = page.get_pixmap(dpi=300)
                    img_path = f"{file_path}_ocr_temp_p{page_num}.png"
                    pix.save(img_path)

                    try:
                        detected_lang = detect_script(normalized_text)
                        paddle_engine = self._get_paddle_ocr(detected_lang) or self._get_paddle_ocr('en')

                        if paddle_engine:
                            ocr_result = paddle_engine.ocr(img_path, cls=True)
                            paddle_lines = []
                            ocr_blocks = []

                            if ocr_result and ocr_result[0]:
                                for line in ocr_result[0]:
                                    bbox, (text, conf) = line
                                    clean_ocr_text = normalize_unicode(text).strip()
                                    if clean_ocr_text and not is_text_corrupted(clean_ocr_text):
                                        paddle_lines.append(clean_ocr_text)
                                        ocr_blocks.append({
                                            "text": clean_ocr_text,
                                            "bounding_box": bbox,
                                            "confidence": float(conf)
                                        })

                            image_ocr_text = "\n".join(paddle_lines).strip()
                            if image_ocr_text and not is_text_corrupted(image_ocr_text):
                                normalized_text = image_ocr_text
                                blocks = ocr_blocks
                                text_corrupted = False
                            else:
                                normalized_text = normalize_unicode(image_ocr_text)
                    except Exception as ocr_err:
                        print(f"Fallback Image OCR error on page {page_num}: {ocr_err}")
                    finally:
                        if os.path.exists(img_path):
                            try:
                                os.remove(img_path)
                            except Exception:
                                pass

                # Final Unicode Normalization & Cleaning
                final_clean_text = normalize_unicode(normalized_text)

                pages_data.append({
                    "page_number": page_num,
                    "full_text": final_clean_text,
                    "blocks": blocks,
                    "is_corrupted_native": text_corrupted
                })

            doc.close()
            return page_count, pages_data

        else:
            # Handle standalone image (JPG, PNG)
            page_count = 1
            paddle_engine = self._get_paddle_ocr('en')
            full_text = ""
            blocks = []

            if paddle_engine:
                try:
                    ocr_result = paddle_engine.ocr(file_path, cls=True)
                    lines = []
                    if ocr_result and ocr_result[0]:
                        for line in ocr_result[0]:
                            bbox, (text, conf) = line
                            clean_t = normalize_unicode(text).strip()
                            if clean_t and not is_text_corrupted(clean_t):
                                lines.append(clean_t)
                                blocks.append({
                                    "text": clean_t,
                                    "bounding_box": bbox,
                                    "confidence": float(conf)
                                })
                    full_text = "\n".join(lines)
                except Exception as e:
                    print(f"Image OCR error: {e}")

            clean_image_text = normalize_unicode(full_text)
            pages_data.append({
                "page_number": 1,
                "full_text": clean_image_text,
                "blocks": blocks,
                "is_corrupted_native": is_text_corrupted(clean_image_text)
            })
            return page_count, pages_data

ocr_service = OCRService()

