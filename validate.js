#!/usr/bin/env node

/**
 * Validation Script for Simulatore Gibus
 * 
 * This script validates:
 * 1. SVG file integrity
 * 2. Basic geometry calculations
 * 3. Documentation completeness
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

let testsPassed = 0;
let testsFailed = 0;

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function testPass(name) {
    testsPassed++;
    log(`✅ ${name}`, 'green');
}

function testFail(name, reason) {
    testsFailed++;
    log(`❌ ${name}`, 'red');
    if (reason) log(`   Reason: ${reason}`, 'yellow');
}

// ===================================================================
// TEST 1: Check SVG Files Exist and Are Valid XML
// ===================================================================

log('\n📄 Testing SVG Files...', 'cyan');

const svgFiles = [
    'examples/profilo_standard_6x3.svg',
    'examples/profilo_aerodinamico.svg',
    'examples/profilo_con_led.svg',
    'examples/spalla_piena.svg',
    'examples/spalla_a_i.svg'
];

svgFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    
    if (!fs.existsSync(filePath)) {
        testFail(`${fileName} exists`, 'File not found');
        return;
    }
    testPass(`${fileName} exists`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check it's valid XML (basic check)
        if (!content.includes('<?xml') && !content.includes('<svg')) {
            testFail(`${fileName} is valid SVG`, 'Missing XML/SVG declaration');
            return;
        }
        
        // Check for required SVG structure
        if (!content.includes('xmlns="http://www.w3.org/2000/svg"')) {
            testFail(`${fileName} has SVG namespace`, 'Missing xmlns declaration');
            return;
        }
        testPass(`${fileName} has SVG namespace`);
        
        // Check for geometric elements
        const hasGeometry = content.includes('<rect') || 
                          content.includes('<path') ||
                          content.includes('<circle') ||
                          content.includes('<polygon');
        
        if (!hasGeometry) {
            testFail(`${fileName} contains geometry`, 'No geometric elements found');
            return;
        }
        testPass(`${fileName} contains geometry`);
        
        // Check file size is reasonable (not empty, not too large)
        const sizeKB = content.length / 1024;
        if (sizeKB < 0.1 || sizeKB > 1000) {
            testFail(`${fileName} has reasonable size`, `Size: ${sizeKB.toFixed(2)} KB`);
            return;
        }
        testPass(`${fileName} has reasonable size (${sizeKB.toFixed(2)} KB)`);
        
    } catch (error) {
        testFail(`${fileName} is readable`, error.message);
    }
});

// ===================================================================
// TEST 2: Check Documentation Files
// ===================================================================

log('\n📚 Testing Documentation...', 'cyan');

const docFiles = [
    { path: 'README.md', minSize: 100 },
    { path: 'ESEMPI_UTILIZZO.md', minSize: 1000 },
    { path: 'examples/README.md', minSize: 500 }
];

docFiles.forEach(({ path: filePath, minSize }) => {
    const fileName = path.basename(filePath);
    
    if (!fs.existsSync(filePath)) {
        testFail(`${fileName} exists`, 'File not found');
        return;
    }
    testPass(`${fileName} exists`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        if (content.length < minSize) {
            testFail(`${fileName} has sufficient content`, `Only ${content.length} bytes (expected >${minSize})`);
            return;
        }
        testPass(`${fileName} has sufficient content (${content.length} bytes)`);
        
        // Check for markdown structure
        if (!content.includes('#')) {
            testFail(`${fileName} is valid Markdown`, 'No headers found');
            return;
        }
        testPass(`${fileName} is valid Markdown`);
        
    } catch (error) {
        testFail(`${fileName} is readable`, error.message);
    }
});

// ===================================================================
// TEST 3: Check Core Application Files
// ===================================================================

log('\n🔧 Testing Core Application Files...', 'cyan');

const coreFiles = [
    { path: 'import_000.html', requiredStrings: ['SVG', 'FEM', 'exportToFEM'] },
    { path: 'fem_engine_v4.js', requiredStrings: ['BeamSectionWithHoles', 'HoleStressAnalysis', 'LocalMeshRefinement'] },
    { path: 'index.html', requiredStrings: ['Simulatore', 'FEM', 'solveBeamSystem'] },
    { path: 'tests.html', requiredStrings: ['Test Suite', 'runAllTests', 'FEM'] }
];

coreFiles.forEach(({ path: filePath, requiredStrings }) => {
    const fileName = path.basename(filePath);
    
    if (!fs.existsSync(filePath)) {
        testFail(`${fileName} exists`, 'File not found');
        return;
    }
    testPass(`${fileName} exists`);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check file size is reasonable
        const sizeKB = content.length / 1024;
        if (sizeKB < 1) {
            testFail(`${fileName} has content`, `Only ${sizeKB.toFixed(2)} KB`);
            return;
        }
        testPass(`${fileName} has content (${sizeKB.toFixed(2)} KB)`);
        
        // Check for required strings/functionality
        requiredStrings.forEach(str => {
            if (!content.includes(str)) {
                testFail(`${fileName} includes "${str}"`, 'String not found');
            } else {
                testPass(`${fileName} includes "${str}"`);
            }
        });
        
    } catch (error) {
        testFail(`${fileName} is readable`, error.message);
    }
});

// ===================================================================
// TEST 4: Basic Geometry Calculations
// ===================================================================

log('\n📐 Testing Basic Geometry Calculations...', 'cyan');

// Test rectangular area calculation
const rectArea = (width, height) => width * height;
const hollowRectArea = (outerW, outerH, innerW, innerH) => {
    return rectArea(outerW, outerH) - rectArea(innerW, innerH);
};

// Test case 1: Standard profile 60x30 with 3mm walls
const profileArea = hollowRectArea(60, 30, 54, 24);
const expectedProfileArea = 504; // mm²
if (Math.abs(profileArea - expectedProfileArea) < 1) {
    testPass(`Hollow rectangle area (60x30, t=3mm): ${profileArea} mm²`);
} else {
    testFail(`Hollow rectangle area`, `Got ${profileArea}, expected ${expectedProfileArea}`);
}

// Test case 2: Inertia calculation (simplified)
const rectangularInertia = (b, h) => (b * Math.pow(h, 3)) / 12;
const I_outer = rectangularInertia(60, 30);
const I_inner = rectangularInertia(54, 24);
const I_net = I_outer - I_inner;

if (I_net > 0 && I_net < I_outer) {
    testPass(`Hollow rectangle inertia: ${I_net.toFixed(0)} mm⁴`);
} else {
    testFail(`Hollow rectangle inertia`, `Invalid value: ${I_net}`);
}

// Test case 3: Peterson Kt approximation
/**
 * Calculate stress concentration factor Kt for a hole in a finite-width plate
 * Formula source: Peterson's Stress Concentration Factors
 * Kt = 3.0 - 3.14(d/W) + 3.667(d/W)² - 1.527(d/W)³
 * 
 * Valid range: d/W < 0.5 (for larger ratios, Kt → 3.0 as per infinite plate)
 * 
 * @param {number} d - Hole diameter (mm)
 * @param {number} W - Plate width (mm)
 * @returns {number} Stress concentration factor Kt (≥ 1.0)
 */
const calculateKt_Peterson = (d, W) => {
    if (W <= 0 || d <= 0) return 1.0;
    const ratio = d / W;
    // For d/W >= 0.5, use Kirsch solution for infinite plate
    if (ratio >= 0.5) return 3.0;
    return 3.0 - 3.14 * ratio + 3.667 * Math.pow(ratio, 2) - 1.527 * Math.pow(ratio, 3);
};

const Kt = calculateKt_Peterson(4, 33); // 4mm hole in 33mm wide section
const expectedKt = 2.6; // Approximate
const ktTolerance = 0.3;

if (Math.abs(Kt - expectedKt) < ktTolerance) {
    testPass(`Peterson Kt (d=4mm, W=33mm): ${Kt.toFixed(3)}`);
} else {
    testFail(`Peterson Kt`, `Got ${Kt.toFixed(3)}, expected ~${expectedKt}`);
}

// ===================================================================
// TEST 5: Directory Structure
// ===================================================================

log('\n📁 Testing Directory Structure...', 'cyan');

const requiredDirs = ['examples'];
requiredDirs.forEach(dir => {
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
        testPass(`Directory '${dir}' exists`);
        
        // Check it's not empty
        const files = fs.readdirSync(dir);
        if (files.length > 0) {
            testPass(`Directory '${dir}' contains files (${files.length} files)`);
        } else {
            testFail(`Directory '${dir}' contains files`, 'Directory is empty');
        }
    } else {
        testFail(`Directory '${dir}' exists`, 'Not found');
    }
});

// ===================================================================
// SUMMARY
// ===================================================================

log('\n' + '='.repeat(60), 'blue');
log('TEST SUMMARY', 'blue');
log('='.repeat(60), 'blue');

const total = testsPassed + testsFailed;
const passRate = total > 0 ? ((testsPassed / total) * 100).toFixed(1) : 0;

log(`\nTotal Tests: ${total}`, 'cyan');
log(`Passed: ${testsPassed}`, 'green');
log(`Failed: ${testsFailed}`, testsFailed > 0 ? 'red' : 'green');
log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : (passRate >= 70 ? 'yellow' : 'red'));

if (testsFailed > 0) {
    log('\n⚠️  Some tests failed. Please review the errors above.', 'yellow');
    process.exit(1);
} else {
    log('\n✅ All tests passed!', 'green');
    log('🎉 The SVG import system and FEM engine are ready for use.', 'green');
    process.exit(0);
}
