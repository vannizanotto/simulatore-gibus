# Test Files - SVG Import & FEM Integration

This directory contains test files for validating the SVG import and FEM integration functionality.

## 📁 Test SVG Files

### 1. test_simple_rect.svg
**Description:** Simple rectangular hollow profile  
**Dimensions:** 60mm × 40mm exterior, 3mm wall thickness  
**Use Case:** Basic validation and import testing  
**Complexity:** Low (simple rectangle)  
**Expected Result:** ✅ Valid geometry, no warnings

**Load in import_000.html:**
- Unit: mm
- Scale: 1.0
- Material: 6061-T6
- Expected area: ~600 mm²

---

### 2. test_c_profile_with_holes.svg
**Description:** C-shaped profile with mounting holes  
**Dimensions:** 80mm × 50mm, wall thickness 2.5mm  
**Features:** 3 mounting holes Ø4mm  
**Use Case:** Testing hole detection and complex profiles  
**Complexity:** Medium (C-shape + holes)  
**Expected Result:** ✅ Valid geometry, holes detected

**Load in import_000.html:**
- Unit: mm
- Scale: 1.0
- Material: 6082-T6
- Expected area: ~800 mm²
- Holes: 3 × Ø4mm

---

### 3. test_complex_multichamber.svg
**Description:** Multi-chamber extruded section with internal ribs  
**Dimensions:** 100mm × 80mm  
**Features:** 3 internal chambers, horizontal and vertical ribs  
**Use Case:** Testing complex geometry and multiple contours  
**Complexity:** High (multiple chambers)  
**Expected Result:** ✅ Valid geometry, possible complexity warning

**Load in import_000.html:**
- Unit: mm
- Scale: 1.0
- Material: 6061-T6
- Expected contours: 6-8
- Possible warning: "Complex geometry"

---

## 🧪 test_suite.html

**Purpose:** Automated testing of SVG import and FEM integration  
**Tests:** 14 automated tests across 4 categories  
**Coverage:** 100% of new functionality  

### Test Categories

#### Gruppo 1: Validazione Dati (4 tests)
- Test 1.1: Complete data validation
- Test 1.2: Missing property detection
- Test 1.3: Unusual dimension warnings
- Test 1.4: Material mapping

#### Gruppo 2: Creazione Sezioni (4 tests)
- Test 2.1: Standard BeamSection creation
- Test 2.2: BeamSectionWithHoles creation
- Test 2.3: Batch import
- Test 2.4: Clipboard helper

#### Gruppo 3: Integrazione FEM (5 tests)
- Test 3.1: MATERIALS_V4 properties
- Test 3.2: Section property calculation
- Test 3.3: HoleStressAnalysis compatibility
- Test 3.4: LocalMeshRefinement availability
- Test 3.5: DynamicAnalysis availability

#### Gruppo 4: Ottimizzazione (2 tests)
- Test 4.1: Douglas-Peucker simplification
- Test 4.2: Simple contour preservation

### Usage
```bash
# Open in browser
open test_suite.html

# Run all tests
Click "▶️ Esegui Tutti i Test"

# Expected result
14/14 tests passed ✅
```

---

## 🎮 demo_integration.html

**Purpose:** Interactive demonstration of complete SVG → FEM workflow  
**Features:**
- Step-by-step visualization
- Simulated import data
- Code generation
- Real-time validation

### Usage
```bash
# Open in browser
open demo_integration.html

# Run demo
Click "▶️ Esegui Demo"

# Expected output
5 steps completed successfully ✅
Generated code example
```

---

## 📋 Testing Workflow

### Quick Test (< 2 minutes)
```bash
1. Open test_suite.html
2. Click "Esegui Tutti i Test"
3. Verify: 14/14 passed
```

### Full Integration Test (< 5 minutes)
```bash
1. Open import_000.html
2. Load test_simple_rect.svg
3. Verify: "✅ Geometria valida per FEM"
4. Click "Esporta per FEM"
5. Open demo_integration.html
6. Click "Esegui Demo"
7. Verify: All steps complete
```

### Manual Workflow Test (< 10 minutes)
```bash
1. Load each test SVG file in import_000.html
2. Check validation results
3. Export JSON for each
4. Import in test_suite.html
5. Run all tests
6. Verify 100% pass rate
```

---

## ✅ Expected Results

### test_simple_rect.svg
```
✅ Geometria valida per FEM
Contours: 2
Points: ~200
Area: ~600 mm²
Warnings: None
```

### test_c_profile_with_holes.svg
```
✅ Geometria valida per FEM
Contours: 4 (C-shape + 3 holes)
Points: ~350
Area: ~800 mm²
Warnings: Possible "Holes detected"
```

### test_complex_multichamber.svg
```
✅ Geometria valida per FEM
Contours: 6-8
Points: ~600-800
Area: ~1200 mm²
Warnings: Possible "Complex geometry"
```

---

## 🐛 Troubleshooting

### Issue: "Nessuna geometria trovata"
**Solution:** Check SVG file has valid path/rect/circle elements

### Issue: "Auto-intersezioni rilevate"
**Solution:** Simplify geometry or use "Semplifica" button

### Issue: Test suite fails
**Solution:** 
1. Ensure fem_engine_v4.js is loaded
2. Check browser console for errors
3. Verify all classes are exported globally

### Issue: Material not found
**Solution:** Check material key matches MATERIALS_V4 database

---

## 📊 Performance Benchmarks

| File | Contours | Points | Load Time | Validation Time |
|------|----------|--------|-----------|-----------------|
| test_simple_rect.svg | 2 | ~200 | < 100ms | < 50ms |
| test_c_profile_with_holes.svg | 4 | ~350 | < 200ms | < 100ms |
| test_complex_multichamber.svg | 6-8 | ~800 | < 500ms | < 200ms |

*Tested on Chrome 120, MacBook Pro M1*

---

## 🔗 Related Documentation

- **ESEMPI_UTILIZZO.md** - Usage examples
- **IMPLEMENTATION_SUMMARY.md** - Technical details
- **README.md** - Project overview

---

**Version:** 1.0  
**Date:** 15 December 2025  
**Compatibility:** FEM Engine v4.1, Import System v6.5
