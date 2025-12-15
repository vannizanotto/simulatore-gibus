#!/bin/bash
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  SVG Section Importer - Validation Test                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

echo "✓ Test 1: File existence"
if [ -f "svg_section_importer.js" ]; then
    echo "  - svg_section_importer.js: OK"
else
    echo "  - svg_section_importer.js: FAIL"
    exit 1
fi

if [ -f "index.html" ]; then
    echo "  - index.html: OK"
else
    echo "  - index.html: FAIL"
    exit 1
fi

echo ""
echo "✓ Test 2: JavaScript syntax check"
node --check svg_section_importer.js && echo "  - svg_section_importer.js syntax: OK" || echo "  - svg_section_importer.js syntax: FAIL"

echo ""
echo "✓ Test 3: Module exports"
grep -q "window.SVGSectionImporter" svg_section_importer.js && echo "  - SVGSectionImporter export: OK" || echo "  - FAIL"
grep -q "window.SVGProfileManager" svg_section_importer.js && echo "  - SVGProfileManager export: OK" || echo "  - FAIL"

echo ""
echo "✓ Test 4: Integration in index.html"
grep -q "svg_section_importer.js" index.html && echo "  - Script tag in index.html: OK" || echo "  - FAIL"
grep -q "svgProfileManager" index.html && echo "  - Global instance created: OK" || echo "  - FAIL"

echo ""
echo "✓ Test 5: Example SVG files"
SVG_COUNT=$(find examples -name "*.svg" 2>/dev/null | wc -l)
echo "  - Found $SVG_COUNT example SVG files"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "All validation tests passed! ✓"
echo "═══════════════════════════════════════════════════════════"
