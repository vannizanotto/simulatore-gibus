# Esempi di Utilizzo - Simulatore Gibus FEM v4.1

## Panoramica

Questo documento fornisce esempi pratici di utilizzo del simulatore FEM Gibus dopo i miglioramenti apportati nella versione 4.1.

## 📁 File Principali

### 1. `fem_engine_v4.js` - Motore FEM Ultra Avanzato
**Novità v4.1:**
- ✅ Analisi dinamica ottimizzata (Newmark-Beta con caching)
- ✅ Classe `LocalMeshRefinement` per raffinamento mesh locale
- ✅ Classe `SVGProfileImporter` per import profili SVG **[NUOVO]**
- ✅ Documentazione estesa inline
- ✅ Ottimizzazioni prestazioni

### 2. `import_000.html` - Sistema Import SVG & Editor
**Novità v6.5:**
- ✅ Integrazione FEM v4.1
- ✅ Validazione SVG per compatibilità FEM **[NUOVO]**
- ✅ Export dati per analisi FEM
- ✅ Documentazione interattiva
- ✅ Database materiali esteso

### 3. `index.html` - Applicazione Simulatore Principale
Applicazione completa per simulazione bracci estensibili.

### 4. `test_suite.html` - Suite Test Automatizzata **[NUOVO]**
Test completi per validazione SVG import e integrazione FEM.

---

## 📥 Esempio 0: Import Profili SVG per Analisi FEM **[NUOVO v4.1]**

### Scenario
Importare un profilo SVG di sezione estrusa da `import_000.html` e utilizzarlo per analisi FEM strutturale.

### Procedura Completa

#### Passo 1: Preparazione SVG in import_000.html

1. Aprire `import_000.html` nel browser
2. Caricare file SVG profilo in **Slot A**
3. Impostare:
   - Unità: `mm`
   - Scala: `1.0`
   - Materiale: `EN AW-6061 (AlMg1SiCu) - Structural USA`
   - Trattamento: `T6`
4. Click **"Carica"** → Il sistema valida automaticamente la geometria SVG
5. Verificare nel log:
   ```
   Slot 1: Caricati 2 contorni.
   Slot 1: ✅ Geometria valida per FEM
   ```
6. Click **📖 Documentazione** → **📤 Esporta per FEM**
7. Dati JSON copiati in clipboard automaticamente

#### Passo 2: Import in Applicazione FEM

```javascript
// In index.html o altra applicazione FEM

// 1. Recupera dati da clipboard (già in formato JSON)
const importedJSON = `...dati da clipboard...`;
const importData = JSON.parse(importedJSON);

// 2. Usa SVGProfileImporter per creare sezione FEM
const importer = new SVGProfileImporter();

// 2a. Import singola sezione
const section = importer.createSectionFromImport(importData.sections[0]);

console.log('Sezione importata:');
console.log('  Larghezza:', section.W, 'm');
console.log('  Altezza:', section.H, 'm');
console.log('  Area:', section.A, 'm²');
console.log('  Inerzia Ixx:', section.I, 'm⁴');

// 2b. Oppure import batch di tutte le sezioni
const allSections = importer.importBatch(importData);
allSections.forEach((item, idx) => {
    console.log(`Sezione ${idx + 1} (Slot ${item.slotId}):`);
    console.log('  Area:', item.section.A);
    console.log('  Materiale:', item.metadata.materialKey);
});

// 3. Usa sezione per creare elemento FEM
const material = MATERIALS_V4['6061-T6'];
const nodeI = { x: 0, y: 0, u: 0, v: 0, theta: 0 };
const nodeJ = { x: 1.5, y: 0, u: 0, v: 0, theta: 0 };

const element = new CorotationalBeamElement(
    nodeI, nodeJ,
    section,  // Sezione importata da SVG!
    material
);

// Elemento pronto per analisi FEM!
```

### Output Atteso

```json
{
  "version": "6.5",
  "femEngineVersion": "4.1",
  "sections": [
    {
      "width": 0.033,
      "height": 0.062,
      "t_v": 0.0028,
      "t_h": 0.0028,
      "area": 0.0002345,
      "inertia_Ixx": 2.45e-8,
      "inertia_Iyy": 8.12e-9,
      "centroid": { "x": 0.0165, "y": 0.031 },
      "materialKey": "6061-T6",
      "material": {
        "name": "EN AW-6061 (AlMg1SiCu) - Structural USA",
        "density": 2700,
        "E": 69,
        "yield": 240,
        "tensile": 290
      }
    }
  ]
}
```

### Validazione Geometria SVG

Il sistema esegue automaticamente le seguenti verifiche:

1. ✅ **Chiusura contorni** - Verifica che i contorni siano chiusi (distanza < 1mm)
2. ✅ **Auto-intersezioni** - Rileva intersezioni anomale nella geometria
3. ✅ **Complessità** - Avvisa se troppi punti (> 5000)
4. ✅ **Dimensioni** - Controlla che area e perimetro siano ragionevoli
5. ✅ **Numero contorni** - Verifica numero appropriato di contorni

**Esempio log validazione:**
```
Slot 1: Caricati 2 contorni.
Slot 1: ⚠️ Avvisi validazione
  - Contorno 2: Contorno molto complesso (3458 punti). Considerare semplificazione.
Slot 1: ✅ Geometria valida per FEM
```

### Opzioni Avanzate Import

```javascript
// Import con aggiunta fori per fissaggio
const sectionWithHoles = importer.createSectionFromImport(importData.sections[0], {
    addHoles: true,
    numHoles: 3,
    holeDiameter_mm: 4.2,
    holeSpacing_mm: 50,
    notchRadius_mm: 0.5
});

// La sezione include automaticamente analisi avanzata fori (Peterson, EC9)
sectionWithHoles.performAdvancedAnalysis();
const holeResults = sectionWithHoles.getAdvancedResults(150, 800);
console.log('Kt effettivo:', holeResults.Kt_effective);
console.log('Utilizzo bearing:', holeResults.bearing_utilization);
```

### Helper Metodo fromClipboard

```javascript
// Modo ancora più rapido - direttamente da clipboard
const sections = SVGProfileImporter.fromClipboard(clipboardText, {
    addHoles: true,
    numHoles: 3,
    holeDiameter_mm: 4.2
});

// Accesso immediato alle sezioni
const mySection = sections[0].section;
const metadata = sections[0].metadata;
```

---

## 🎯 Esempio 1: Analisi Dinamica con Caching

### Scenario
Analisi modale di un profilo estruso 6061-T6 per identificare frequenze naturali.

### Codice

```javascript
// Creazione elementi e nodi (esempio semplificato)
const elements = [...]; // Array di elementi CorotationalBeamElement
const nodes = [...];    // Array di nodi
const bc = [            // Condizioni al contorno
    { node: 0, dof: 0 }, // Incastro in X
    { node: 0, dof: 1 }, // Incastro in Y
    { node: 0, dof: 2 }  // Incastro in θ
];

// Inizializzazione analisi dinamica
const dynamicAnalysis = new DynamicAnalysis(elements, nodes, bc);

// Estrazione primi 5 modi (OTTIMIZZATO v4.1 con caching)
const modes = dynamicAnalysis.modalAnalysis(5);

// Risultati
modes.forEach((mode, i) => {
    console.log(`Modo ${i + 1}:`);
    console.log(`  Frequenza: ${mode.frequency.toFixed(2)} Hz`);
    console.log(`  Periodo: ${mode.period.toFixed(3)} s`);
    console.log(`  Massa efficace: ${mode.effectiveMass.toFixed(4)} kg`);
});
```

### Output Atteso
```
Modo 1:
  Frequenza: 12.45 Hz
  Periodo: 0.080 s
  Massa efficace: 0.8543 kg

Modo 2:
  Frequenza: 45.32 Hz
  Periodo: 0.022 s
  Massa efficace: 0.1234 kg

...
```

---

## 🔬 Esempio 2: Raffinamento Mesh Locale attorno a Foro

### Scenario
Analisi dettagliata di concentrazione tensioni attorno a un foro Ø4mm in zona critica.

### Codice

```javascript
// Geometria foro
const geometry = {
    centerX: 0,      // mm
    centerY: 0,      // mm
    radius: 2,       // mm (diametro 4mm)
    domainSize: 16   // mm (8 raggi)
};

// Materiale
const material = MATERIALS_V4['6061-T6'];

// Opzioni raffinamento
const options = {
    refinementLevels: 3,     // 3 livelli radiali
    angularDivisions: 16,    // 16 divisioni angolari
    elementOrder: 2          // Elementi quadratici
};

// Inizializzazione mesh raffinata
const localMesh = new LocalMeshRefinement(geometry, material, options);

// Generazione mesh
const meshData = localMesh.generateRefinedMesh();
console.log(`Mesh generata: ${meshData.numNodes} nodi, ${meshData.numElements} elementi`);

// Risoluzione problema elastico (tensione remota 100 MPa)
const sigma_remote = 100; // MPa
const stresses = localMesh.solveLocalElasticProblem(sigma_remote);

// Estrazione Kt numerico
const ktResult = localMesh.extractStressConcentrationFactor(stresses, sigma_remote);

console.log(`Kt numerico: ${ktResult.Kt_numeric.toFixed(3)}`);
console.log(`Kt teorico (Kirsch): ${ktResult.Kt_theory.toFixed(3)}`);
console.log(`Errore: ${ktResult.error_percent.toFixed(2)}%`);
console.log(`Tensione massima: ${ktResult.maxStress.toFixed(1)} MPa`);
console.log(`Posizione: r=${ktResult.location.r.toFixed(2)}mm, θ=${(ktResult.location.theta * 180/Math.PI).toFixed(1)}°`);
```

### Output Atteso
```
Mesh generata: 112 nodi, 96 elementi
Kt numerico: 2.987
Kt teorico (Kirsch): 3.000
Errore: 0.43%
Tensione massima: 298.7 MPa
Posizione: r=2.03mm, θ=90.2°
```

**Interpretazione:**
- La soluzione numerica converge al valore teorico di Kirsch (Kt=3 per foro in piastra infinita)
- La tensione massima si verifica a θ=90° (bordo foro perpendicolare al carico)
- Errore < 1% indica mesh adeguatamente raffinata

---

## 📐 Esempio 3: Import SVG e Export per FEM

### Scenario
Importare un profilo SVG di una sezione estrusa, analizzare proprietà, ed esportare per simulazione FEM.

### Procedura

1. **Aprire** `import_000.html` nel browser

2. **Caricare SVG** in Slot A:
   - Click su "Carica File SVG A"
   - Selezionare file profilo (es. `profilo_6x3.svg`)
   - Impostare unità: `mm`
   - Scala: `1.0`

3. **Selezionare Materiale**:
   - Materiale: `EN AW-6061 (AlMg1SiCu) - Structural USA`
   - Trattamento: `T6`

4. **Verificare Risultati**:
   - Pannello "Output Comparativo" mostra:
     - Area: `234.5 mm²`
     - Ixx: `2.45×10⁻⁸ m⁴`
     - Massa lineare: `0.633 kg/m`
     - Spessore min: `2.8 mm`

5. **Esportare per FEM**:
   - Click `📖 Documentazione`
   - Scroll in fondo, click `📤 Esporta per FEM`
   - Dati JSON copiati in clipboard!

### Dati Esportati (JSON)
```json
{
  "version": "6.5",
  "femEngineVersion": "4.1",
  "sections": [
    {
      "width": 0.033,
      "height": 0.062,
      "t_v": 0.0028,
      "t_h": 0.0028,
      "area": 0.0002345,
      "inertia_Ixx": 2.45e-8,
      "inertia_Iyy": 8.12e-9,
      "centroid": { "x": 0.0165, "y": 0.031 },
      "materialKey": "6061-T6",
      "material": {
        "name": "EN AW-6061 (AlMg1SiCu) - Structural USA",
        "density": 2700,
        "E": 69,
        "yield": 240,
        "tensile": 290
      },
      "slotId": 1,
      "originalUnit": "mm",
      "scale": 1,
      "timestamp": "2025-12-13T07:45:00.000Z"
    }
  ]
}
```

### Utilizzo in `index.html`

```javascript
// In index.html, caricare dati JSON e creare sezione FEM
const importedData = JSON.parse(clipboardData);
const sectionData = importedData.sections[0];

// Creazione BeamSectionWithHoles da dati importati
const customSection = new window.BeamSectionWithHoles({
    type: 'hollow_rect',
    width: sectionData.width,
    height: sectionData.height,
    t_v: sectionData.t_v,
    t_h: sectionData.t_h,
    materialKey: sectionData.materialKey,
    
    // Esempio: aggiungi fori per fissaggi
    numHoles: 3,
    holeDiameter_mm: 4.2,
    holeSpacing_mm: 50
});

// La sezione è ora pronta per simulazione FEM!
```

---

## 🧪 Esempio 4: Analisi Avanzata Fori (EC9 + Peterson)

### Scenario
Verifica completa di una zona forata secondo EC9 (Eurocodice 9) con analisi Peterson per fatica.

### Codice

```javascript
// Parametri sezione con fori
const sectionParams = {
    type: 'hollow_rect',
    width: 0.033,   // m
    height: 0.062,  // m
    t_v: 0.003,     // m
    t_h: 0.003,     // m
    numHoles: 3,
    holeDiameter_mm: 4.2,
    holeSpacing_mm: 50,
    materialKey: '6061-T6',
    notchRadius_mm: 0.5
};

// Creazione sezione
const section = new BeamSectionWithHoles(sectionParams);

// Esecuzione analisi avanzata
section.performAdvancedAnalysis();

// Calcolo con tensione nominale 150 MPa e forza per bullone 800 N
const results = section.getAdvancedResults(150, 800);

console.log('=== ANALISI AVANZATA FORI ===');
console.log(`Kt effettivo (Peterson): ${results.Kt_effective.toFixed(3)}`);
console.log(`Kf fatica: ${results.Kf.toFixed(3)}`);
console.log(`Sensibilità intaglio q: ${results.notch_sensitivity.toFixed(3)}`);
console.log(`Tensione locale max: ${results.sigma_max_local.toFixed(1)} MPa`);
console.log(`Utilizzo bearing: ${results.bearing_utilization.toFixed(1)}%`);
console.log(`Fattore sicurezza fatica: ${results.fatigue_safety_factor.toFixed(2)}`);
console.log(`Status fatica: ${results.fatigue_status}`);
console.log(`Distanze EC9 OK: ${results.ec9_distances_ok ? 'SÌ' : 'NO'}`);
```

### Output Atteso
```
=== ANALISI AVANZATA FORI ===
Kt effettivo (Peterson): 2.125
Kf fatica: 1.856
Sensibilità intaglio q: 0.714
Tensione locale max: 318.8 MPa
Utilizzo bearing: 45.3%
Fattore sicurezza fatica: 2.34
Status fatica: OK
Distanze EC9 OK: SÌ
```

**Interpretazione:**
- ✅ Kt = 2.125 è ragionevole per fori multipli con p/d ≈ 12
- ✅ Bearing al 45% → margine adeguato
- ✅ SF fatica = 2.34 → sicuro per vita infinita
- ✅ Distanze EC9 rispettate

---

## 📊 Esempio 5: Confronto Materiali

### Scenario
Confrontare prestazioni di diverse leghe per lo stesso profilo.

### Codice

```javascript
const materials = ['6060-T6', '6061-T6', '6082-T6', '7075-T6'];
const appliedStress = 200; // MPa

console.log('CONFRONTO MATERIALI (σ = 200 MPa)');
console.log('─'.repeat(60));

materials.forEach(matKey => {
    const mat = MATERIALS_V4[matKey];
    const section = new BeamSectionWithHoles({
        width: 0.033, height: 0.062, t_v: 0.003, t_h: 0.003,
        materialKey: matKey, numHoles: 3, holeDiameter_mm: 4.2
    });
    
    section.performAdvancedAnalysis();
    const results = section.getAdvancedResults(appliedStress, 600);
    
    const utilizationYield = (appliedStress / mat.yield) * 100;
    const utilizationUTS = (appliedStress / mat.tensile) * 100;
    
    console.log(`${mat.name}:`);
    console.log(`  Snervamento: ${mat.yield} MPa (util: ${utilizationYield.toFixed(1)}%)`);
    console.log(`  Rottura: ${mat.tensile} MPa (util: ${utilizationUTS.toFixed(1)}%)`);
    console.log(`  SF Fatica: ${results.fatigue_safety_factor.toFixed(2)}`);
    console.log(`  Bearing: ${results.bearing_utilization.toFixed(1)}%`);
    console.log('');
});
```

### Output Atteso
```
CONFRONTO MATERIALI (σ = 200 MPa)
────────────────────────────────────────────────────────────
6060 T6:
  Snervamento: 150 MPa (util: 133.3%)
  Rottura: 190 MPa (util: 105.3%)
  SF Fatica: 1.12
  Bearing: 52.3%

6061 T6 (Strutturale):
  Snervamento: 240 MPa (util: 83.3%)
  Rottura: 290 MPa (util: 69.0%)
  SF Fatica: 1.98
  Bearing: 43.2%

6082 T6:
  Snervamento: 260 MPa (util: 76.9%)
  Rottura: 310 MPa (util: 64.5%)
  SF Fatica: 2.15
  Bearing: 41.5%

7075 T6 (Ergal):
  Snervamento: 505 MPa (util: 39.6%)
  Rottura: 570 MPa (util: 35.1%)
  SF Fatica: 4.52
  Bearing: 35.8%
```

**Conclusione:**
- 6060-T6: ❌ Sovraccarico plastico (>100%)
- 6061-T6: ✅ Appropriato per carichi medi
- 6082-T6: ✅ Buon compromesso
- 7075-T6: ✅ Sovradimensionato ma massima sicurezza

---

## 🎓 Best Practices

### 1. Scelta Materiale
- Applicazioni standard: **6061-T6** (buon compromesso costo/prestazioni)
- Alte prestazioni: **7075-T6** (quando peso è critico)
- Economico: **6060-T6** (solo per bassi carichi)

### 2. Raffinamento Mesh
- Fori critici: usare `LocalMeshRefinement` con `refinementLevels >= 3`
- Verificare convergenza Kt: errore < 2% rispetto a teoria

### 3. Analisi Fatica
- Target: SF ≥ 1.5 per vita infinita
- Considerare sempre Kf (non solo Kt)
- Verificare `notch_sensitivity` del materiale

### 4. Eurocodice 9 (EC9)
- Rispettare sempre distanze minime fori (e1, p1)
- Bearing: mantere utilizzo < 80%
- Sezione netta: riduzione area < 30%

---

## 📚 Riferimenti

1. **Eurocodice 9 (EN 1999-1-1)**: Design of aluminium structures
2. **Peterson's Stress Concentration Factors**: Hole analysis
3. **Kirsch Solution**: Elastic stress around holes
4. **Newmark-Beta Method**: Time integration for dynamics

---

## 🆘 Troubleshooting

### Problema: Kt molto diverso da teoria
**Soluzione:** Aumentare `refinementLevels` o `angularDivisions` in LocalMeshRefinement

### Problema: Export JSON non funziona
**Soluzione:** Verificare che entrambe le sezioni siano caricate e abbiano materiale assegnato

### Problema: Analisi modale non converge
**Soluzione:** Controllare condizioni al contorno e ridurre `numModes` richiesti

---

## 🧪 Esempio 6: Esecuzione Test Suite **[NUOVO v4.1]**

### Scenario
Validare il sistema di import SVG e l'integrazione FEM attraverso test automatizzati.

### Procedura

1. Aprire `test_suite.html` nel browser
2. Click **▶️ Esegui Tutti i Test**
3. Verificare risultati nei 4 gruppi di test:
   - **Gruppo 1:** Validazione dati import SVG
   - **Gruppo 2:** Creazione sezioni FEM da dati SVG
   - **Gruppo 3:** Integrazione FEM completa
   - **Gruppo 4:** Ottimizzazione contorni

### Test Disponibili

#### Test Validazione (Gruppo 1)
```
✓ Test 1.1: Validazione dati completi
✓ Test 1.2: Rilevamento proprietà mancanti
✓ Test 1.3: Warning per dimensioni inusuali
✓ Test 1.4: Mapping materiali
```

#### Test Import (Gruppo 2)
```
✓ Test 2.1: Creazione BeamSection standard
✓ Test 2.2: Creazione BeamSectionWithHoles
✓ Test 2.3: Import batch multiplo
✓ Test 2.4: Helper fromClipboard
```

#### Test Integrazione (Gruppo 3)
```
✓ Test 3.1: Verifica proprietà MATERIALS_V4
✓ Test 3.2: Calcolo proprietà sezione importata
✓ Test 3.3: Compatibilità con HoleStressAnalysis
✓ Test 3.4: LocalMeshRefinement esistenza
✓ Test 3.5: DynamicAnalysis esistenza
```

#### Test Ottimizzazione (Gruppo 4)
```
✓ Test 4.1: Douglas-Peucker semplificazione
✓ Test 4.2: Contorni già semplici non modificati
```

### Output Atteso

```
📊 Riepilogo Finale
🎉 TUTTI I TEST SUPERATI!
14/14 test superati (100.0%)
```

### Esecuzione Selettiva

```html
<!-- Eseguire solo test specifici -->
<button onclick="runValidationTests()">🔍 Solo Test Validazione</button>
<button onclick="runImportTests()">📥 Solo Test Import</button>
<button onclick="runIntegrationTests()">🔗 Solo Test Integrazione</button>
```

### File SVG di Test Forniti

Il repository include 3 file SVG di esempio per testing:

1. **`test_simple_rect.svg`**
   - Profilo rettangolare semplice 60×40mm
   - Spessore 3mm
   - Ideale per test base

2. **`test_c_profile_with_holes.svg`**
   - Profilo a C 80×50mm
   - 3 fori Ø4mm per fissaggio
   - Test import con fori

3. **`test_complex_multichamber.svg`**
   - Sezione multi-camera con nervature
   - Test complessità geometrica
   - Ottimizzazione contorni

### Utilizzo File Test

```javascript
// In import_000.html:
// 1. Caricare test_simple_rect.svg in Slot A
// 2. Verificare validazione: "✅ Geometria valida per FEM"
// 3. Esportare JSON
// 4. Aprire test_suite.html
// 5. Eseguire test per verificare compatibilità
```

---

## 📧 Contatti

Per ulteriori informazioni o supporto:
- Repository: [GitHub - vannizanotto/simulatore-gibus](https://github.com/vannizanotto/simulatore-gibus)
- Autore: Vanni Zanotto

---

**Versione Documento:** 1.1  
**Data:** 15 Dicembre 2025  
**Compatibilità:** FEM Engine v4.1, Import System v6.5, Test Suite v1.0
