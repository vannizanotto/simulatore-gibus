# Simulatore Gibus FEM v4.1

Simulatore avanzato basato su metodo FEM (Finite Element Method) per l'analisi strutturale di bracci estensibili per tende da sole.

## 🎯 Funzionalità Principali

- **Import SVG**: Caricamento e analisi di profili e sezioni da file SVG
- **Motore FEM Avanzato**: Calcoli strutturali con plasticità, dinamica e analisi fori
- **Analisi EC9**: Verifica secondo Eurocodice 9 per strutture in alluminio
- **Database Materiali**: Oltre 15 leghe di alluminio con parametri completi
- **Editor Interattivo**: Modifica geometrie e visualizzazione real-time

## 📁 File Principali

- **`svg_section_importer.js`** - Modulo riutilizzabile per import SVG (NUOVO)
- **`import_000.html`** - Sistema di import SVG e analisi sezioni
- **`index.html`** - Simulatore principale per bracci estensibili
- **`fem_engine_v4.js`** - Motore FEM con analisi avanzata fori
- **`tests.html`** - Suite di test automatizzati
- **`examples/`** - File SVG di esempio
- **`ESEMPI_UTILIZZO.md`** - Guida completa con esempi

## 🆕 SVG Section Importer Module

Il nuovo modulo `svg_section_importer.js` fornisce funzionalità riutilizzabili per l'importazione e analisi di profili SVG:

### Caratteristiche

- **Parsing SVG Avanzato**: Supporto per path, rect, circle, ellipse, polygon, polyline
- **Trasformazioni CTM**: Applicazione corretta di tutte le trasformazioni SVG
- **Multi-Layer Detection**: Riconoscimento automatico profilo/spalla (3 layer)
- **Proprietà Geometriche**: Calcolo automatico di Area, Inerzia, Baricentro
- **Analisi Spessori**: Rilevamento spessore minimo parete
- **Export FEM**: Compatibilità con BeamSectionWithHoles (fem_engine_v4.js)

### Utilizzo

```javascript
// Crea istanza del manager
const manager = new SVGProfileManager({
    samplingPoints: 400,
    unit: 'mm',
    scale: 1.0
});

// Carica da file input
manager.loadFromFileInput(fileInput, 'beam')
    .then(profile => {
        console.log('Area:', profile.area_mm2, 'mm²');
        console.log('Inerzia:', profile.I_mm4, 'mm⁴');
        console.log('Layer:', profile.layerInfo);
    });

// Export per FEM
const femData = manager.exportToFEM('beam');
```

## 🚀 Quick Start

1. Aprire `import_000.html` nel browser
2. Caricare un file SVG di esempio da `examples/`
3. Selezionare materiale e unità di misura
4. Visualizzare proprietà calcolate e esportare per FEM

## 📚 Documentazione

- [Esempi di Utilizzo](ESEMPI_UTILIZZO.md) - Guide dettagliate con codice
- [Esempi SVG](examples/README.md) - Documentazione file di esempio
- [Test Suite](tests.html) - Test automatizzati per validazione

## 🧪 Testing

```bash
# Validazione rapida
node validate.js

# Test completi (aprire nel browser)
open tests.html
```

## 👤 Autore

**Vanni Zanotto**  
Repository: [github.com/vannizanotto/simulatore-gibus](https://github.com/vannizanotto/simulatore-gibus)

## 📄 Licenza

Questo progetto è fornito per scopi educativi e di ricerca.
