import os
import json
from pathlib import Path
from test_ocr import OCRTester
import cv2
import numpy as np

class AdvancedOCRTester(OCRTester):
    def __init__(self, input_dir="input", output_dir="output"):
        super().__init__(input_dir, output_dir)
    
    def visualize_results(self, img_path, output_path=None):
        try:
            img = cv2.imread(img_path)
            if img is None:
                print(f"Error: Tidak bisa membaca {img_path}")
                return
            output = self.process_image(img_path)
            
            if output is None:
                print(f"Error: OCR processing gagal untuk {img_path}")
                return
            
            print(f"\n{'='*60}")
            print(f"ocr analysis")
            print(f"File: {os.path.basename(img_path)}")
            print(f"Size: {img.shape}")
            print(f"{'='*60}\n")
            
            # process setiap result
            for i, res in enumerate(output, 1):
                self._print_detailed_result(res, i)
            
            # save visual output jika diminta
            if output_path:
                self._save_visualization(img, output, output_path)
                print(f"visualization disimpan ke: {output_path}")
        
        except Exception as e:
            print(f"error dalam visualization: {str(e)}")
    
    def _print_detailed_result(self, res, result_num):
        print(f"result {result_num}:")
        print("-" * 60)
        
        # Print berbagai atribut dari result
        attributes = {
            'tables': 'tables',
            'cells': 'cells',
            'html': 'html',
            'layout': 'layout'
        }
        
        for attr, label in attributes.items():
            if hasattr(res, attr):
                value = getattr(res, attr)
                if value:
                    print(f"  {label}:")
                    if isinstance(value, list) and len(value) > 0:
                        print(f"    Count: {len(value)}")
                        # Print sample dari list
                        for idx, item in enumerate(value[:3], 1):
                            if hasattr(item, '__dict__'):
                                print(f"    Item {idx}: {item.__dict__}")
                            else:
                                print(f"    Item {idx}: {item}")
                        if len(value) > 3:
                            print(f"    ... and {len(value) - 3} more items")
                    else:
                        print(f"    Value: {value}")
        
        print(f"\n  Raw Output:\n  {str(res)}\n")
    
    def _save_visualization(self, img, output, output_path):
        try:
            cv2.imwrite(output_path, img)
        except Exception as e:
            print(f"Warning: Gagal save visualization: {str(e)}")
    
    def compare_results(self, img_filename, expected_text):
        img_path = os.path.join(self.input_dir, img_filename)
        
        print(f"\n{'='*60}")
        print(f"comparison test")
        print(f"{'='*60}")
        print(f"File: {img_filename}")
        print(f"Expected: '{expected_text}'")
        print(f"{'='*60}\n")
        
        output = self.process_image(img_path)
        
        if output:
            # extract text pakai ocr
            extracted_texts = self.extract_text(output)
            
            print(f"Extracted Results:")
            for i, text in enumerate(extracted_texts, 1):
                print(f"  {i}. '{text}'")
                
                # simple similarity check
                similarity = self._similarity_score(text, expected_text)
                print(f"     Similarity Score: {similarity:.1%}")
                
                if similarity > 0.8:
                    print(f"     MATCH!")
                else:
                    print(f"     PARTIAL MATCH")
            
            if not extracted_texts:
                print("  no text extracted")
        else:
            print("OCR processing failed")
    
    def _similarity_score(self, str1, str2):
        str1 = str1.lower().strip()
        str2 = str2.lower().strip()
        
        if str1 == str2:
            return 1.0
        
        # hitung matching characters
        matches = sum(1 for a, b in zip(str1, str2) if a == b)
        max_len = max(len(str1), len(str2))
        
        if max_len == 0:
            return 1.0
        
        return matches / max_len
    
    def test_with_validation(self, test_cases):
        print(f"\n{'='*60}")
        print(f"BATCH VALIDATION TEST")
        print(f"{'='*60}\n")
        
        results = {
            'total': len(test_cases),
            'passed': 0,
            'failed': 0,
            'cases': []
        }
        
        for filename, expected_text in test_cases:
            print(f"\nTesting: {filename}")
            print(f"Expected: '{expected_text}'")
            
            img_path = os.path.join(self.input_dir, filename)
            
            if not os.path.exists(img_path):
                print(f"File not found: {img_path}")
                results['failed'] += 1
                results['cases'].append({
                    'file': filename,
                    'expected': expected_text,
                    'status': 'FILE_NOT_FOUND'
                })
                continue
            
            output = self.process_image(img_path)
            extracted = self.extract_text(output) if output else []
            
            # Check if expected text found
            found = any(self._similarity_score(text, expected_text) > 0.7 
                       for text in extracted)
            
            case_result = {
                'file': filename,
                'expected': expected_text,
                'extracted': extracted,
                'status': 'PASS' if found else 'FAIL'
            }
            
            if found:
                print(f"PASS - Found matching text")
                results['passed'] += 1
            else:
                print(f"FAIL - Expected text not found")
                results['failed'] += 1
            
            results['cases'].append(case_result)
        
        # summary
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {results['total']}")
        print(f"Passed: {results['passed']} ✅")
        print(f"Failed: {results['failed']} ❌")
        pass_rate = (results['passed'] / results['total'] * 100) if results['total'] > 0 else 0
        print(f"Pass Rate: {pass_rate:.1f}%")
        print(f"{'='*60}\n")
        
        # Save results
        summary_path = os.path.join(self.output_dir, 'validation_results.json')
        with open(summary_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"Results saved to: {summary_path}")
        
        return results


def main():
    print("\n" + "="*60)
    print("ADVANCED OCR TESTING WITH VISUALIZATION")
    print("="*60 + "\n")
    
    tester = AdvancedOCRTester(input_dir="input", output_dir="output")
    
    # detailed visualization
    print("\nOption 1: Detailed Analysis of Single Image")
    input_dir = "input"
    if os.path.exists(input_dir) and os.listdir(input_dir):
        first_image = os.listdir(input_dir)[0]
        img_path = os.path.join(input_dir, first_image)
        tester.visualize_results(img_path)
    else:
        print("No images found in input folder")
    
    # comparison test
    print("\nOption 2: Comparison with Expected Results")
    print("Contoh: tester.compare_results('Coba_Tebak.png', 'A')")
    print("Contoh: tester.compare_results('Coba_Tebak2.png', 'BA')")
    
    # Validation test
    print("\nOption 3: Batch Validation")
    test_cases = [
        # (filename, expected_text)
        # Add your test cases here
        # ('Coba_Tebak.png', 'A'),
        # ('Coba_Tebak2.png', 'BA'),
    ]
    
    if test_cases:
        results = tester.test_with_validation(test_cases)


if __name__ == "__main__":
    main()
