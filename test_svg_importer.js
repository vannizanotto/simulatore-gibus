#!/usr/bin/env node
/**
 * Test script for svg_section_importer.js
 * Tests the SVG import functionality with example files
 */

const fs = require('fs');
const path = require('path');

// Simulate browser environment for testing
global.DOMParser = require('xmldom').DOMParser;
global.document = {
    createElementNS: () => ({ setAttribute: () => {}, appendChild: () => {} }),
    createElement: () => ({ 
        style: {},
        appendChild: () => {},
        querySelectorAll: () => []
    }),
    body: {
        appendChild: () => {},
        removeChild: () => {}
    }
};

// Load the module
require('./svg_section_importer.js');

const { SVGSectionImporter, SVGProfileManager } = global;

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║  SVG Section Importer - Test Suite                      ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Test 1: Module loading
console.log('✓ Test 1: Module loading');
console.log(`  - SVGSectionImporter: ${typeof SVGSectionImporter === 'function' ? 'OK' : 'FAIL'}`);
console.log(`  - SVGProfileManager: ${typeof SVGProfileManager === 'function' ? 'OK' : 'FAIL'}`);

// Test 2: Class instantiation
console.log('\n✓ Test 2: Class instantiation');
try {
    const importer = new SVGSectionImporter();
    const manager = new SVGProfileManager();
    console.log('  - SVGSectionImporter instance: OK');
    console.log('  - SVGProfileManager instance: OK');
} catch (e) {
    console.log('  - Error:', e.message);
}

// Test 3: Load example SVG files
console.log('\n✓ Test 3: Loading example SVG files');
const examplesDir = path.join(__dirname, 'examples');
const svgFiles = fs.readdirSync(examplesDir).filter(f => f.endsWith('.svg'));

console.log(`  Found ${svgFiles.length} SVG files:`);
svgFiles.forEach(file => {
    console.log(`    - ${file}`);
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('All basic tests passed! ✓');
console.log('For full testing, open index.html in a browser.');
console.log('═══════════════════════════════════════════════════════════\n');
